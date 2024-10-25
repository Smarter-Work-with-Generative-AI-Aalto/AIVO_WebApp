//pages/teams/[slug]/document-store.tsx
import React from 'react';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import DocumentStore from '@/components/documentStore/DocumentStore';
import { Error, Loading } from '@/components/shared';
import { AccessControl } from '@/components/shared/AccessControl';
import useTeam from 'hooks/useTeam';
import env from '@/lib/env';
import type { TeamFeature } from 'types';

const DocumentStorePage = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return (
    <div className="space-y-6">
      <DocumentStore team={team} />
      <AccessControl resource="team" actions={['view', 'edit']}>
        {/* Add any additional components or actions that require access control */}
      </AccessControl>
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default DocumentStorePage;
