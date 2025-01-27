import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { documentIds } = req.query;

  if (!documentIds) {
    return res.status(400).json({ message: 'Document IDs are required' });
  }

  try {
    const documentIdArray = (documentIds as string).split(',');

    const chunks = await prisma.documentVector.findMany({
      where: {
        documentId: { in: documentIdArray },
      },
      select: {
        metadata: true,
      },
    });
    res.status(200).json(chunks);
  } catch (error) {
    console.error('Error fetching document chunks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}