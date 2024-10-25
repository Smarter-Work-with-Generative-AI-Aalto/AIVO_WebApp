//models/document.ts
import { ApiError } from '@/lib/errors';
import { Action, Resource, permissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Role, TeamMember } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

export const createDocument = async (data: {
  teamId: string;
  title: string;
  content: string;
  status: string;
  fileName: string;
  type: string;
}) => {
  return await prisma.document.create({
    data,
  });
};

export const updateDocument = async ({ where, data }) => {
  return await prisma.document.update({
    where,
    data,
  });
};

export const getDocument = async (key: { id: string }) => {
  const document = await prisma.document.findUnique({
    where: key,
  });

  return document;
};

export const getDocumentsByTeam = async (teamId: string) => {
  return await prisma.document.findMany({
    where: { teamId },
  });
};

export const getDocumentsByStatus = async (teamId: string, status: string) => {
  return await prisma.document.findMany({
      where: { 
          teamId,
          status
      },
  });
};

export const deleteDocument = async (key: { id: string }) => {
  return await prisma.document.delete({
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
