// models/aiRequestQueue.ts
import { ApiError } from '../lib/errors';
import { Action, Resource, permissions } from '../lib/permissions';
import { prisma } from '../lib/prisma';
import { Role, TeamMember } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../lib/session';

export const createAIRequestQueue = async (data: {
  userId: string;
  teamId: string;
  documentIds: string[];
  userSearchQuery: string;
  overallQuery: string;
  similarityScore?: number;
  sequentialQuery?: boolean;
  enhancedSearch?: boolean;
  status: string;
  individualFindings: any[];
  overallSummary: string;
}) => {
  return await prisma.aIRequestQueue.create({
    data,
  });
};

export const updateAIRequestQueue = async ({ where, data }) => {
  return await prisma.aIRequestQueue.update({
    where,
    data,
  });
};

export const getAIRequestQueue = async (key: { id: string }) => {
  const request = await prisma.aIRequestQueue.findUnique({
    where: key,
  });

  return request;
};

export const getAIRequestQueueByTeam = async (teamId: string) => {
  return await prisma.aIRequestQueue.findMany({
    where: { teamId },
  });
};

export const deleteAIRequestQueue = async (key: { id: string }) => {
  return await prisma.aIRequestQueue.delete({
    where: key,
  });
};

const isAllowed = (role: Role, resource: Resource, action: Action) => {
  const rolePermissions = permissions[role];

  if (!rolePermissions) {
    return false;
  }

  for (const permission of rolePermissions) {
    if (
      permission.resource === resource &&
      (permission.actions === '*' || permission.actions.includes(action))
    ) {
      return true;
    }
  }

  return false;
};

export const throwIfNotAllowed = (
  user: Pick<TeamMember, 'role'>,
  resource: Resource,
  action: Action
) => {
  if (isAllowed(user.role, resource, action)) {
    return true;
  }

  throw new ApiError(
    403,
    `You are not allowed to perform ${action} on ${resource}`
  );
};

// Get current user from session
export const getCurrentUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
};
