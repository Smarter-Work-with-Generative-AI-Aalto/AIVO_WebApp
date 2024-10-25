import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { AIModelSchema } from '@/lib/zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      // case 'DELETE':
      //   await handleDELETE(req, res);
      //   break;
      default:
        res.setHeader('Allow', 'POST, GET, PUT');
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'team_ai_model', 'create');

  const validatedData = AIModelSchema.parse(req.body);

  const existingModel = await prisma.aIModel.findFirst({
    where: { teamId: teamMember.team.id },
  });

  let aiModel;
  if (existingModel) {
    aiModel = await prisma.aIModel.update({
      where: { id: existingModel.id },
      data: validatedData,
    });
  } else {
    aiModel = await prisma.aIModel.create({
      data: {
        teamId: teamMember.team.id,
        ...validatedData,
      },
    });
  }

  res.status(200).json({ data: aiModel });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'team_ai_model', 'read');

  const aiModels = await prisma.aIModel.findMany({
    where: { teamId: teamMember.team.id },
  });

  res.status(200).json({ data: aiModels });
};

const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'team_ai_model', 'update');

  const validatedData = AIModelSchema.parse(req.body);

  const aiModel = await prisma.aIModel.update({
    where: { teamId: teamMember.team.id },
    data: validatedData,
  });

  res.status(200).json({ data: aiModel });
};

// const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
//   const teamMember = await throwIfNoTeamAccess(req, res);
//   throwIfNotAllowed(teamMember, 'team_ai_model', 'delete');

//   const { id } = req.query;

//   await prisma.aIModel.delete({ where: { id: id as string } });

//   res.status(200).json({ data: {} });
// };
