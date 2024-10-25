import { GetServerSidePropsContext } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';

const Home: NextPageWithLayout = () => {
  const { t } = useTranslation('common');

  return (
    <div className="p-3">
      <p className="text-sm">{t('ai-research')}</p>
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

export default Home;
