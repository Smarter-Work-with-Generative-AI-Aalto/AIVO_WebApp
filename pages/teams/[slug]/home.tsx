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
      Welcome to Aivo Qualitative! The AI-tool for qualitative research. 
      You can upload documents to Aivo and analyze them as soon as you have set up your API key for OpenAI.
      <b>YES, we hope to support all LLMs in the future, but for now you have to use OpenAI.</b>
      <br />
      <h2>How to set up your API key for OpenAI?</h2>
      <p>
        Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API keys</a> and create a new API key. This requires setting up your credit card payments. Aivo is free, but OpenAI is not.
        <br />
        Copy the API key and paste it into the field in Settings / AI Models.
      </p>
      <h2>How to upload documents?</h2>
      <p>
        Go to the Document Store tab and click on the "Upload" button.
      </p>
      <h2>How to analyze documents?</h2>
      <p>
        Go to the AI Research tab, select documents to analyze (e.g. all), define your prompt and click on "Research".
      </p>
      <h2>Where are the results?</h2>
      <p>
        AI can be slow, especially with a lot of data. After a while your results will be visible in Activity Log tab. You can export them into Excel or look at them on the browser.
      </p>
      <h2>Final warning!</h2>
      <p>
        This is an open source project hosted by university researchers. We are not responsible for any data loss or other issues that may arise from using Aivo. 
        Our service is not GDPR compliant and our cybersecurity is probably much worse than we think. You can download the source code and run it locally on your laptop with your own Azure vector database.
      </p>
      <h2>How to contribute?</h2>
      <p>
        We are open to contributions. Please go check <a href="https://github.com/Smarter-Work-with-Generative-AI-Aalto/AIVO_WebApp" target="_blank" rel="noopener noreferrer">https://github.com/Smarter-Work-with-Generative-AI-Aalto/AIVO_WebApp</a>.
      </p>
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
