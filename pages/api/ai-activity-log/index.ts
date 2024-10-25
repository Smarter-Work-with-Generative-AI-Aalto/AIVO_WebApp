// pages/api/ai-activity-log/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { getAIActivityLogByTeam, deleteAIActivityLog } from '../../../models/aiActivityLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET' && method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (method === 'GET') {
    const { teamId } = req.query;
      if (!teamId) {
        return res.status(400).json({ message: 'Missing teamId' });
      }
      const logs = await getAIActivityLogByTeam(String(teamId));
      return res.status(200).json(logs);
    }

    if (method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'Missing activity log id' });
      }
      await deleteAIActivityLog({ id });
      return res.status(200).json({ message: 'Activity log deleted successfully' });
    }
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
