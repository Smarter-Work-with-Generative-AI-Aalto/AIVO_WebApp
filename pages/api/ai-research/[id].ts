// pages/api/ai-activity-log/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { getAIActivityLog } from '../../../models/aiActivityLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const activityLog = await getAIActivityLog({ id });

        if (!activityLog) {
            return res.status(404).json({ message: 'Results not found' });
        }

        return res.status(200).json(activityLog);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
