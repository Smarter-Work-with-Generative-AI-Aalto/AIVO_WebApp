import React from 'react';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import AIActivityLog from '../../../components/activityLog/AIActivityLog';
import useTeam from 'hooks/useTeam';
import { Loading, Error } from '@/components/shared';

const ActivityLogPage: NextPageWithLayout = () => {
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
        <AIActivityLog teamId={team.id} teamSlug={team.slug}/>
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default ActivityLogPage;
