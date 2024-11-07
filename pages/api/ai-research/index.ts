// pages/api/ai-research/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { getUserBySession } from 'models/user';
import { createAIRequestQueue } from '../../../models/aiRequestQueue';
import { processResearchRequestQueue } from '../../../lib/researchQueue';

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

    const { userId, teamId, documentIds, userSearchQuery, overallQuery, similarityScore, sequentialQuery, enhancedSearch } = req.body;
    const user =  await getUserBySession(session);
    
    if (!user || !teamId || !documentIds || !userSearchQuery) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Use the createAIRequestQueue model function to create a new request
        const newRequest = await createAIRequestQueue({
            userId : user.id,
            teamId,
            documentIds,
            userSearchQuery,
            overallQuery: overallQuery || 'The following text is a summary of different outputs. Please provide an inclusive extended summary of the following answers:',
            similarityScore: similarityScore || 1.0,
            sequentialQuery: sequentialQuery !== undefined ? sequentialQuery : true,
            enhancedSearch: enhancedSearch !== undefined ? enhancedSearch : false,
            status: 'in queue',  // Set initial status to 'in queue'
            individualFindings: [],
            overallSummary: '',
        });

        console.log(newRequest);
        // Process the request queue for the team
        processResearchRequestQueue(teamId);

        return res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating research request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
