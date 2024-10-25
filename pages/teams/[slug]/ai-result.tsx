//pages/teams/[slug]/ai-result.tsx
import React from 'react';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ResearchResultsPage from '../../../components/research/ResearchResultsPage';
import { Error, Loading } from '../../../components/shared';
import useTeam from '../../../hooks/useTeam';
import { NextPageWithLayout } from '../../../types';

interface ResultPageProps {
  resultId: string;
}

const ResultPage: NextPageWithLayout<ResultPageProps> = ({ resultId }) => {
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
      <div className="p-3">
        <ResearchResultsPage resultId={resultId} />
      </div>
    );
  };
  
  export async function getServerSideProps(context: GetServerSidePropsContext) {
    const { id } = context.query;
  
    // Redirect to a 404 page if no id or slug is provided
    if (!id) {
      return {
        notFound: true,
      };
    }
  
    return {
      props: {
        resultId: id,
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  }

export default ResultPage;
