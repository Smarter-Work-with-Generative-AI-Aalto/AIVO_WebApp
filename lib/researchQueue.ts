// lib/researchQueue.ts
import { prisma } from '../lib/prisma';
import { sequentialRAGChain, createRAGChain, createOpenAISummary } from '../lib/langchainIntegration';
import { getVectorsForDocumentFromVectorDB } from '../lib/vectorization';
import { Page } from 'openai/pagination';

export async function processResearchRequestQueue(teamId: string) {
    const pendingRequest = await prisma.aIRequestQueue.findFirst({
        where: { teamId, status: 'in queue' },
        orderBy: { createdAt: 'asc' },
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

    const overallSummary = await createOpenAISummary(allFindings, teamId, pendingRequest.overallQuery);

    await prisma.aIRequestQueue.update({
        where: { id },
        data: {
            status: 'completed',
            overallSummary,
        },
    });

    await prisma.aIActivityLog.create({
        data: {
            ...pendingRequest,
            status: 'completed',
            individualFindings: allFindings,
            overallSummary,
        },
    });

    await prisma.aIRequestQueue.delete({
        where: { id },
    });
}

const extractMetadataValue = (metadataAttributes, key) => {
    const attribute = metadataAttributes.find(attr => attr.key === key);
    return attribute ? attribute.value : 'N/A';
};

async function handleDocumentSearch(documentChunks: { content: string, metadata: any }[], query: string, sequential: boolean, teamId: string) {
    const allFindings: { title: string, page: string, content: string }[] = [];

    if (sequential) {
        for (const chunk of documentChunks) {
            const result = await createRAGChain(query, chunk, teamId);
            
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
        const results = await createRAGChain(query, documentChunks, teamId);

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