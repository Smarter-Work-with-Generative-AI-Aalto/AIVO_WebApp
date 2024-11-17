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

  let validatedData = AIModelSchema.parse(req.body);

  const existingModel = await prisma.aIModel.findFirst({
    where: { teamId: teamMember.team.id },
  });

  // We will only allow AI key to be overwritten if its not an abridged key -- this is because we always censor keys sent to the UI.
  if (validatedData.openAIApiKey && validatedData.openAIApiKey.length < 12)
      validatedData.openAIApiKey = existingModel?.openAIApiKey || undefined;
  if (validatedData.googleAIApiKey && validatedData.googleAIApiKey.length < 12)
      validatedData.googleAIApiKey = existingModel?.googleAIApiKey || undefined;
  if (validatedData.azureOpenAIApiKey && validatedData.azureOpenAIApiKey.length < 12)
      validatedData.azureOpenAIApiKey = existingModel?.azureOpenAIApiKey || undefined;

  console.log("We are about to update the API keys...");
  console.log("the gemini key we got is: ", validatedData.googleAIApiKey, " while the existing one is: ", existingModel?.googleAIApiKey);
  console.log("the azure key we got is: ", validatedData.azureOpenAIApiKey, " while the existing one is: ", existingModel?.azureOpenAIApiKey);
  console.log("the openai key we got is: ", validatedData.openAIApiKey, " while the existing one is: ", existingModel?.openAIApiKey);

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

  const censoredModels = aiModels.map(model => ({
    ...model,
    azureOpenAIApiKey: model.azureOpenAIApiKey ? `sk-......${model.azureOpenAIApiKey.slice(-4)}` : null,
    openAIApiKey: model.openAIApiKey ? `sk-......${model.openAIApiKey.slice(-4)}` : null,
    googleAIApiKey: model.googleAIApiKey ? `sk-......${model.googleAIApiKey.slice(-4)}` : null,
  }));

  return res.status(200).json({
    data: censoredModels
  });
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
