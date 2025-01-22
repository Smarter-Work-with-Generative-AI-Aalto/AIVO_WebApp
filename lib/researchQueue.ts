// lib/researchQueue.ts
import { executeQuery, createAISummary } from './langchainIntegration';
import { getVectorsForDocumentFromVectorDB } from './vectorization';
import { Page } from 'openai/pagination';
import { sendResearchCompleteEmail } from './email/sendResearchCompleteEmail';
import { prisma } from './prisma';
import { getPastFindings } from '../models/aiRequestQueue';

function removeDuplicateFindings(findings) {
    return findings.filter((item, index, array) =>
        array.findIndex(
            (t) =>
                t.documentId === item.documentId &&
                t.pageContent === item.pageContent
        ) === index
    );
}

export async function processResearchRequestQueue(teamId: string, requestId?: string) {
    const pendingRequest = await prisma.aIRequestQueue.findFirst({
        where: {
            teamId,
            status: 'in queue',
            ...(requestId && { id: requestId }),
        },
        orderBy: { createdAt: 'asc' },
        include: {
            user: true,
            team: true,
        },
    });

    if (!pendingRequest) {
        return;
    }

    const { id, documentIds, userSearchQuery, sequentialQuery, overallQuery } = pendingRequest;

    // 1. Fetch past individual findings that match the userSearchQuery and documents
    let pastFindings = await getPastFindings(teamId, userSearchQuery, documentIds);
    // 2. Remove any duplicates in the already-known findings
    pastFindings = removeDuplicateFindings(pastFindings);
    // 3. Figure out which doc IDs we haven’t analyzed yet
    const existingDocumentIds = pastFindings.map((f) => f.documentId);
    const newDocumentIds = documentIds.filter((docId) => !existingDocumentIds.includes(docId));
    // 4. Gather all doc results (old + new)
    let allFindings = pastFindings;

    // Only re-run analysis on the new documents
    for (let i = 0; i < newDocumentIds.length; i++) {
        const docId = newDocumentIds[i];
        // getVectorsForDocumentFromVectorDB(...) fetches text chunks from your vector DB
        const documentChunks = await getVectorsForDocumentFromVectorDB(docId, teamId);

        const findings = await handleDocumentSearch(
            documentChunks,
            userSearchQuery,
            sequentialQuery,
            teamId
        );

        const findingsWithDocId = findings.map((f) => ({ ...f, documentId: docId }));
        // Merge these new findings:
        allFindings = allFindings.concat(findingsWithDocId);
        // Update partial progress
        await prisma.aIRequestQueue.update({
            where: { id },
            data: {
                status: `researching ${i + 1}/${newDocumentIds.length}`,
                individualFindings: allFindings,
            },
        });
    }
    // 5. Remove duplicates again from allFindings
    allFindings = removeDuplicateFindings(allFindings);
    // 6. Re-run the overall query (covers the case of changed overall summary)
    const overallSummary = await createAISummary(allFindings, teamId, overallQuery, 'openAI');

    // Mark the queue as complete
    await prisma.aIRequestQueue.update({
        where: { id },
        data: {
            status: 'completed',
            overallSummary,
        },
    });

    // Insert a new entry in the AI Activity Log with old+new doc results
    const activityLog = await prisma.aIActivityLog.create({
        data: {
            id,
            user: { connect: { id: pendingRequest.userId } },
            team: { connect: { id: pendingRequest.teamId } },
            documentIds: pendingRequest.documentIds,
            userSearchQuery: pendingRequest.userSearchQuery,
            overallQuery: pendingRequest.overallQuery,
            similarityScore: pendingRequest.similarityScore,
            sequentialQuery: pendingRequest.sequentialQuery,
            enhancedSearch: pendingRequest.enhancedSearch,
            status: 'completed',
            individualFindings: allFindings,
            overallSummary,
        },
    });

    try {
        // Send email notification to let the user know their results are ready
        await sendResearchCompleteEmail(
            pendingRequest.user.email,
            activityLog.id,
            pendingRequest.team.slug
        );
    } catch (error) {
        console.error('Failed to send research complete email:', error);
    }

    // Remove the request from the queue table since it's now in the activity log
    await prisma.aIRequestQueue.delete({
        where: { id },
    });
}

const extractMetadataValue = (metadataAttributes, key) => {
    const attribute = metadataAttributes.find(attr => attr.key === key);
    return attribute ? attribute.value : 'N/A';
};

// Set up a possibility to use gemini or azureOpenAI
async function handleDocumentSearch(documentChunks: { content: string, metadata: any }[], query: string, sequential: boolean, teamId: string) {
    const allFindings: { title: string, page: string, content: string }[] = [];

    if (sequential) {
        for (const chunk of documentChunks) {
            const result = await executeQuery(query, chunk, teamId, 'openAI');

            const finding = {
                title: extractMetadataValue(chunk.metadata.attributes, 'title') || 'Untitled Document',
                page: extractMetadataValue(chunk.metadata.attributes, 'pageNumber') || 'N/A',
                pageContent: chunk.content,
                content: result.content,
            };
            console.log(finding);
            allFindings.push(finding);
        }
    } else {
        const results = await executeQuery(query, documentChunks, teamId, 'openAI');

        // results.forEach((result, index) => {
        //     const chunk = documentChunks[index];
        //     const finding = {
        //         title: chunk.metadata.title || 'Untitled Document',
        //         page: chunk.metadata.pageNumber || 'N/A',
        //         content: result,
        //     };

        //     allFindings.push(finding);
        // });
    }

    return allFindings;
}