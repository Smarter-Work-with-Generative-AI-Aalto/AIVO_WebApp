// lib/vectorization.ts
/* eslint-disable @typescript-eslint/no-var-requires */
import { AzureAISearchVectorStore, AzureAISearchQueryType, AzureAISearchFilterType } from '@langchain/community/vectorstores/azure_aisearch';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import path from 'path';
import { prisma } from '@/lib/prisma';

const { AZURE_AISEARCH_ENDPOINT, AZURE_AISEARCH_KEY } = process.env;
// Define the base directory for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'public');

// Dynamically load these loaders only when required to prevent bundling in client-side code
let DocxLoader, PPTXLoader, TextLoader, JSONLoader, CSVLoader, PDFLoader, fs;

if (typeof window === 'undefined') {
    // Import these modules only on the server-side
    DocxLoader = require('@langchain/community/document_loaders/fs/docx').DocxLoader;
    PPTXLoader = require('@langchain/community/document_loaders/fs/pptx').PPTXLoader;
    TextLoader = require('langchain/document_loaders/fs/text').TextLoader;
    JSONLoader = require('langchain/document_loaders/fs/json').JSONLoader;
    CSVLoader = require('@langchain/community/document_loaders/fs/csv').CSVLoader;
    PDFLoader = require('@langchain/community/document_loaders/fs/pdf').PDFLoader;
    fs = require('fs/promises');
}

const getOpenAIApiKeyForTeam = async (teamId: string): Promise<string | null> => {
    try {
        const aiModel = await prisma.aIModel.findFirst({
            where: { teamId },
            select: { openAIApiKey: true },
        });
        return aiModel?.openAIApiKey || null;
    } catch (error) {
        console.error('Error fetching OpenAI API key:', error);
        return null;
    }
};

// Function to load a PDF file and return its content
export const loadDocumentContent = async (relativeFilePath: string, mimeType: string): Promise<Document[]> => {
    try {
        // Construct the absolute file path
        const absoluteFilePath = path.join(UPLOADS_DIR, relativeFilePath);

        // Check if the file exists
        await fs.access(absoluteFilePath);

        // Determine the appropriate loader based on MIME type
        let loader;
        switch (mimeType) {
            case 'application/pdf':
                loader = new PDFLoader(absoluteFilePath, { splitPages: false });
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                loader = new DocxLoader(absoluteFilePath);
                break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                loader = new PPTXLoader(absoluteFilePath);
                break;
            case 'text/csv':
                loader = new CSVLoader(absoluteFilePath);
                break;
            case 'text/plain':
                loader = new TextLoader(absoluteFilePath);
                break;
            case 'application/json':
                loader = new JSONLoader(absoluteFilePath);
                break;
            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }

        const documents = await loader.load();

        return documents;
    } catch (error) {
        console.error("Error loading ${mimeType} content:", error);
        throw error;
    }
};

if (!AZURE_AISEARCH_ENDPOINT || !AZURE_AISEARCH_KEY) {
    throw new Error("Azure Search endpoint and key must be set as environment variables");
}

// Function to split document content into chunks using RecursiveCharacterTextSplitter
export const splitDocumentIntoChunks = async (docs: Document[]) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1024,
        chunkOverlap: 128,
    });

    const splitDocuments = await splitter.splitDocuments(docs);
    return splitDocuments.map((chunk, index) => ({
        index,
        text: chunk.pageContent,
        wordCount: chunk.pageContent.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: chunk.pageContent.length,
        pageNumber: chunk.metadata?.loc.pageNumber || 1,
    }));
};

const createVectorStore = (openAIApiKey: string) => {
    const embeddingModel = new OpenAIEmbeddings({ apiKey: openAIApiKey });
    return new AzureAISearchVectorStore(embeddingModel, {
        endpoint: AZURE_AISEARCH_ENDPOINT,
        key: AZURE_AISEARCH_KEY,
        indexName: 'vectorsearch',
        search: { type: AzureAISearchQueryType.SemanticHybrid },
    });
};

const mapChunksToDocuments = (textChunks: any[], documentId: string, teamId: string, title: string) => {
    return textChunks.map((chunk) => {
        const wordCount = chunk.wordCount !== undefined ? chunk.wordCount.toString() : "0";
        const characterCount = chunk.characterCount !== undefined ? chunk.characterCount.toString() : "0";
        const pageNumber = chunk.pageNumber !== undefined ? chunk.pageNumber.toString() : "0";

        return new Document({
            pageContent: chunk.text,
            metadata: {
                source: 'Document',
                attributes: [
                    { key: 'documentId', value: documentId },
                    { key: 'teamId', value: teamId },
                    { key: 'title', value: title },
                    { key: 'chunkIndex', value: chunk.index.toString() },
                    { key: 'wordCount', value: wordCount },
                    { key: 'characterCount', value: characterCount },
                    { key: 'pageNumber', value: pageNumber },
                ],
            },
        });
    });
};
export const vectorizeChunks = async (documentId: string, teamId: string, title: string, content: string, mimeType: string) => {
    try {
        // Fetch OpenAI API key for the team
        const openAIApiKey = await getOpenAIApiKeyForTeam(teamId);
        if (!openAIApiKey) {
            throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
        }

        const docs = await loadDocumentContent(content, mimeType);

        const textChunks = await splitDocumentIntoChunks(docs);

        const vectorStore = createVectorStore(openAIApiKey);

        const documents = mapChunksToDocuments(textChunks, documentId, teamId, title);

        await vectorStore.addDocuments(documents);

    } catch (error) {
        console.error('Error vectorizing chunks:', error);
        throw error;
    }
};

// New function to retrieve vectors for a documentId
export const getVectorsForDocumentFromVectorDB = async (documentId: string, teamId: string) => {
    try {
      const openAIApiKey = await getOpenAIApiKeyForTeam(teamId);
      if (!openAIApiKey) {
        throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
      }
  
      const vectorStore = createVectorStore(openAIApiKey);
  
      // Fetch vectors for the given documentId
      const filter: AzureAISearchFilterType = {
        filterExpression: `metadata/attributes/any(attr: attr/key eq 'documentId' and attr/value eq '${documentId}')`, includeEmbeddings: true,
      };
      const results = await vectorStore.similaritySearch("", 10000, filter); // Empty query with a large limit to retrieve all vectors
      return results.map(result => ({
        content: result.pageContent,
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error('Error retrieving vectors:', error);
      throw error;
    }
  };
  
  // New function to store vectors in Prisma DB
  export const addVectorsInPrismaDB = async (vectors: { content: string, metadata: any }[], documentId: string) => {
    try {
      for (const vector of vectors) {
        await prisma.documentVector.create({
          data: {
            documentId,
            embedding: vector.metadata.embedding,
            content: vector.content,
            metadata: vector.metadata.attributes,
          },
        });
      }
      console.log(`Successfully stored vectors in Prisma DB`);
    } catch (error) {
      console.error('Error storing vectors in Prisma DB:', error);
      throw error;
    }
  };
  

// Function to delete vectors associated with a document
export const deleteVectorsFromVectorDB = async (documentId: string, teamId: string) => {
    try {
        // Fetch OpenAI API key for the team
        const openAIApiKey = await getOpenAIApiKeyForTeam(teamId);
        if (!openAIApiKey) {
            throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
        }

        const vectorStore = createVectorStore(openAIApiKey);

        // Delete documents based on the metadata attribute `documentId`
        await vectorStore.delete({ filter: { filterExpression: `metadata/attributes/any(attr: attr/key eq 'documentId' and attr/value eq '${documentId}')` } });

        console.log(`Successfully deleted vectors from Vector DB`);
    } catch (error) {
        console.error('Error deleting vectors from Vector DB:', error);
        throw error;
    }
};

export const deleteVectorsFromPrismaDB = async (documentId: string) => {
    try {
        await prisma.documentVector.deleteMany({
            where: { documentId },
        });
        console.log(`Successfully deleted vectors from Prisma DB`);
    } catch (error) {
        console.error('Error deleting vectors from Prisma DB:', error);
        throw error;
    }
};