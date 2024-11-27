// lib/langchainIntegration.ts

import { AzureAISearchVectorStore, AzureAISearchQueryType } from '@langchain/community/vectorstores/azure_aisearch';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { pull } from 'langchain/hub';
import { getAIKeysForTeam } from './vectorization';

const getLLMForModel = async (model: string, teamId: string) => {
    const aiKeys = await getAIKeysForTeam(teamId);
    console.log("We are about to get the LLM for the model: ", model);
    switch (model) {
        case 'openAI':
            if (!aiKeys.openAIKey) throw new Error('OpenAI API key not found');
            return new ChatOpenAI({ 
                model: 'gpt-4o', 
                temperature: 0, 
                apiKey: aiKeys.openAIKey 
            });
            
        case 'gemini':
            if (!aiKeys.geminiKey) throw new Error('Gemini API key not found');
            return new ChatGoogleGenerativeAI({ 
                model: 'gemini-1.5-pro', 
                temperature: 0, 
                apiKey: aiKeys.geminiKey 
            });
            
        case 'azureOpenAI':
            if (!aiKeys.openAIKey) throw new Error('Azure OpenAI API key not found');
            return new ChatOpenAI({ 
                model: 'gpt-4o', 
                temperature: 0, 
                apiKey: aiKeys.openAIKey 
            });
            
        default:
            throw new Error(`Unsupported model: ${model}`);
    }
};

const executeQuery = async (query: string, contextDocs: any, teamId: string, model: string) => {
    const llm = await getLLMForModel(model, teamId);
    const queryPrompt = `${query}\n\nText: ${JSON.stringify(contextDocs)}`;
    const response = await llm.invoke(queryPrompt);
    console.log("executed query with model: ", model);
    return response;
}

const createRAGChain = async (query: string, contextDocs: any, teamId: string) => {
    const teamOpenAIApiKey = (await getAIKeysForTeam(teamId)).openAIKey;
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

const createAISummary = async (findings: any[], teamId: string, overallQuery: string, model: string) => {
    const llm = await getLLMForModel(model, teamId);
    // Note to replace summaryPrompt with overallQuery passed as a parameter!!!
    const summaryPrompt = 'The following text is a summary of different outputs. Please provide an inclusive extended summary of the following answers:';
    const findingsCollated = JSON.stringify(findings.map(finding => finding.content));
    const response = await llm.invoke(`${summaryPrompt} ${findingsCollated}`);
    console.log("Overall summary query: "+`${summaryPrompt} ${findingsCollated}`);
    
    const summary = { summary: response.content };
    return summary;
};

export { executeQuery, createAISummary };
