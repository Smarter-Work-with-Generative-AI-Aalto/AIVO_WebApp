import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { getPastResearchQueries } from '../../../models/aiRequestQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { teamId, query } = req.query;
    if (!teamId) {
        return res.status(400).json({ message: 'Team ID is required' });
    }

    try {
        const pastQueries = await getPastResearchQueries(teamId as string, query as string);
        return res.status(200).json(pastQueries);
    } catch (error) {
        console.error('Error fetching past queries:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
} 