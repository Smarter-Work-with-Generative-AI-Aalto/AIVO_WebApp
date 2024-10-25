//pages/teams/[slug]/ai-research.tsx
import React from 'react';
import { GetServerSidePropsContext } from 'next';
import ResearchComponent from '@/components/research/ResearchComponent'; // Correct import
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { Error, Loading } from '@/components/shared';
import useTeam from 'hooks/useTeam';

const AIResearchPage: NextPageWithLayout = () => {
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
        <div className="p-3">
            <ResearchComponent team={team} />
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

export default AIResearchPage;
