// lib/langchainIntegration.ts

import { AzureAISearchVectorStore, AzureAISearchQueryType } from '@langchain/community/vectorstores/azure_aisearch';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { pull } from 'langchain/hub';
import { getOpenAIApiKeyForTeam } from './vectorization';

const createRAGChain = async (query: string, contextDocs: any, teamId: string) => {
    const teamOpenAIApiKey = await getOpenAIApiKeyForTeam(teamId);
    if (!teamOpenAIApiKey) {
        throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
    }

    // const vectorStore = new AzureAISearchVectorStore(
    //     new OpenAIEmbeddings({ apiKey: teamOpenAIApiKey }),
    //     {
    //         endpoint: process.env.AZURE_AISEARCH_ENDPOINT,
    //         key: process.env.AZURE_AISEARCH_KEY,
    //         indexName: 'vectorsearch',
    //         search: { type: AzureAISearchQueryType.SimilarityHybrid },
    //     }
    // );

    // const retriever = vectorStore.asRetriever();
    // const prompt = await pull<ChatPromptTemplate>('rlm/rag-prompt');
    
    // const ragChain = await createStuffDocumentsChain({
    //     llm,
    //     prompt,
    //     outputParser: new StringOutputParser(),
    // });

    // const retrievedDocs = await retriever.invoke(query);
    // console.log('retrievedDocs', retrievedDocs);
    const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0, apiKey: teamOpenAIApiKey});
    const queryPrompt = `${query}\n\nExcerpt: ${JSON.stringify(contextDocs)}`;
    const response = await llm.invoke(queryPrompt);

    return response;
};

const createOpenAISummary = async (findings: any[], teamId: string, overallQuery: string) => {
    const teamOpenAIApiKey = await getOpenAIApiKeyForTeam(teamId);
    if (!teamOpenAIApiKey) {
        throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
    }
    const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0, apiKey: teamOpenAIApiKey });
    const summaryPrompt = overallQuery || 'The following text is a summary of different outputs. Please provide an inclusive extended summary of the following answers:';
    // Create findingsCollated that is a collection of all "content" fields from objects in findings.
    const findingsCollated = JSON.stringify(findings.map(finding => finding.content));
    const response = await llm.invoke(`${summaryPrompt} ${findingsCollated}`);
    console.log("Overall summary query: "+`${summaryPrompt} ${findingsCollated}`);
    const summary = { summary: response.content };
    return summary;
};

export { createRAGChain, createOpenAISummary };
