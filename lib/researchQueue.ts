// lib/researchQueue.ts
import { executeQuery, createAISummary } from './langchainIntegration';
import { getVectorsForDocumentFromVectorDB } from './vectorization';
import { Page } from 'openai/pagination';
import { sendResearchCompleteEmail } from './email/sendResearchCompleteEmail';
import { prisma } from './prisma';

export async function processResearchRequestQueue(teamId: string) {
    const pendingRequest = await prisma.aIRequestQueue.findFirst({
        where: { teamId, status: 'in queue' },
        orderBy: { createdAt: 'asc' },
        include: {
            user: true,  // Include user information to get email
            team: true,  // Include team information to get slug
        }
    });

    if (!pendingRequest) {
        return;
    }

    const { id, documentIds, userSearchQuery, sequentialQuery } = pendingRequest;

    await prisma.aIRequestQueue.update({
        where: { id },
        data: { status: `researching 0/${documentIds.length}` },
    });

    let allFindings = [];

    for (let i = 0; i < documentIds.length; i++) {
        const documentId = documentIds[i];

        // Retrieve document chunks using getVectorsForDocumentFromVectorDB
        const documentChunks = await getVectorsForDocumentFromVectorDB(documentId, teamId);

        const findings = await handleDocumentSearch(documentChunks, userSearchQuery, sequentialQuery, teamId);
        allFindings = allFindings.concat(findings);

        await prisma.aIRequestQueue.update({
            where: { id },
            data: {
                status: `researching ${i + 1}/${documentIds.length}`,
                individualFindings: allFindings,
            },
        });
    }

    // Set up a possibility to use gemini or azureOpenAI
    const overallSummary = await createAISummary(allFindings, teamId, pendingRequest.overallQuery, 'openAI');

    await prisma.aIRequestQueue.update({
        where: { id },
        data: {
            status: 'completed',
            overallSummary,
        },
    });

    const activityLog = await prisma.aIActivityLog.create({
        data: {
            id,
            user: { connect: { id: pendingRequest.userId } }, // Use relation field
            team: { connect: { id: pendingRequest.teamId } }, // Use relation field
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

    // After creating activity log entry, send email notification
    try {
        await sendResearchCompleteEmail(
            pendingRequest.user.email,
            activityLog.id,
            pendingRequest.team.slug
        );
    } catch (error) {
        console.error('Failed to send research complete email:', error);
        // Don't throw error here to avoid failing the whole process
    }

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