// pages/api/ai-research/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { getUserBySession } from 'models/user';
import { createAIRequestQueue } from '../../../models/aiRequestQueue';
import { processResearchRequestQueue } from '../../../lib/researchQueue';
import { getMatchingPastRequest } from '../../../models/aiRequestQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'POST':
            return await handlePost(req, res);
        default:
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
        teamId,
        documentIds,
        userSearchQuery,
        overallQuery,
        similarityScore,
        sequentialQuery,
        enhancedSearch,
    } = req.body;

    const user = await getUserBySession(session);

    if (!user || !teamId || !documentIds || !userSearchQuery) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Case 1: Check if there's a matching past request with the same queries and documents
        const matchingRequest = await getMatchingPastRequest(
            teamId,
            userSearchQuery,
            overallQuery,
            documentIds
        );

        if (matchingRequest) {
            // Case 1: Return the redirect URL with the correct id
            console.log('Matching Request: ', matchingRequest);
            return res.status(200).json({
                redirectTo: `/teams/${matchingRequest.team.slug}/ai-result?id=${matchingRequest.id}`,
            });
        }

        // Case 2: Create a new AI request queue entry
        const newRequest = await createAIRequestQueue({
            userId: user.id,
            teamId,
            documentIds,
            userSearchQuery,
            overallQuery:
                overallQuery ||
                'The following text is a summary of different outputs. Please provide an inclusive extended summary of the following answers:',
            similarityScore: similarityScore || 1.0,
            sequentialQuery:
                sequentialQuery !== undefined ? sequentialQuery : true,
            enhancedSearch:
                enhancedSearch !== undefined ? enhancedSearch : false,
            status: 'in queue',
            individualFindings: [],
            overallSummary: '',
        });

        // This logic covers Cases 2 and 3:
        // The partial reuse of existing results for the same userSearchQuery
        // and the new overall summary if overallQuery changed.
        await processResearchRequestQueue(teamId, newRequest.id);

        return res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error handling research request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
