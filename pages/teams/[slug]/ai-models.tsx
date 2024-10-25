import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import TeamTab from '@/components/team/TeamTab';
import ConfigureAIModels from '@/components/team/ConfigureAIModels';
import useTeam from 'hooks/useTeam';
import { Error, Loading } from '@/components/shared';
import env from '@/lib/env';
import React from 'react';

// console.log('AIModelsPage component loaded');

const AIModelsPage = ({ teamFeatures }) => {
  const { isLoading, isError, team } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message="Team not found" />;
  }

  return (
    <>
      <TeamTab activeTab="ai-models" team={team} teamFeatures={teamFeatures} />
      <ConfigureAIModels team={team} />
    </>
  );
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default AIModelsPage;
