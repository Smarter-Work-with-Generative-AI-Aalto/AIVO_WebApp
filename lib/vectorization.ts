// lib/vectorization.ts
/* eslint-disable @typescript-eslint/no-var-requires */
import { AzureAISearchVectorStore, AzureAISearchQueryType, AzureAISearchFilterType } from '@langchain/community/vectorstores/azure_aisearch';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import os from 'os';
import fs from 'fs';

const { AZURE_AISEARCH_ENDPOINT, AZURE_AISEARCH_KEY } = process.env;
// Define the base directory for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'public');

// Dynamically load these loaders only when required to prevent bundling in client-side code
let DocxLoader, PPTXLoader, TextLoader, JSONLoader, CSVLoader, PDFLoader;

if (typeof window === 'undefined') {
    // Import these modules only on the server-side
    DocxLoader = require('@langchain/community/document_loaders/fs/docx').DocxLoader;
    PPTXLoader = require('@langchain/community/document_loaders/fs/pptx').PPTXLoader;
    TextLoader = require('langchain/document_loaders/fs/text').TextLoader;
    JSONLoader = require('langchain/document_loaders/fs/json').JSONLoader;
    CSVLoader = require('@langchain/community/document_loaders/fs/csv').CSVLoader;
    PDFLoader = require('@langchain/community/document_loaders/fs/pdf').PDFLoader;
}

export const getAIKeysForTeam = async (teamId: string) => {
    try {
        const aiModel = await prisma.aIModel.findFirst({
            where: { teamId },
            select: {
                openAIApiKey: true,
                googleAIApiKey: true,
            },
        });
        return {
            openAIKey: aiModel?.openAIApiKey || null,
            geminiKey: aiModel?.googleAIApiKey || null,
        };
    } catch (error) {
        console.error('Error fetching AI API keys:', error);
        return {
            openAIKey: null,
            geminiKey: null,
        };
    }
};

// Function to load a PDF file and return its content
export const loadDocumentContent = async (fileUrl: string, mimeType: string): Promise<Document[]> => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Create a temporary file path
            const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}-${path.basename(fileUrl)}`);

            // Download file from Azure Blob Storage
            const blobServiceClient = BlobServiceClient.fromConnectionString(
                process.env.AZURE_STORAGE_CONNECTION_STRING
            );

            // Extract container name and blob name from URL
            const url = new URL(fileUrl);
            const pathParts = url.pathname.split('/');
            const containerName = pathParts[1];
            const blobName = decodeURIComponent(pathParts.slice(2).join('/'));

            console.log('Attempting to download blob:', { containerName, blobName });
            
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlobClient(blobName);

            // Download the blob to a local temp file
            await blobClient.downloadToFile(tempFilePath);

            // Determine the appropriate loader based on MIME type
            let loader;
            switch (mimeType) {
                case 'application/pdf':
                    loader = new PDFLoader(tempFilePath, { splitPages: true });
                    break;
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    loader = new DocxLoader(tempFilePath);
                    break;
                case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                    loader = new PPTXLoader(tempFilePath);
                    break;
                case 'text/csv':
                    loader = new CSVLoader(tempFilePath);
                    break;
                case 'text/plain':
                    loader = new TextLoader(tempFilePath);
                    break;
                case 'application/json':
                    loader = new JSONLoader(tempFilePath);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${mimeType}`);
            }

            const documents = await loader.load();

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            return documents;
        } catch (error) {
            if (attempt === maxRetries) {
                console.error(`Final attempt failed after ${maxRetries} retries:`, error);
                throw error;
            }
            console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    throw new Error('Failed to load document after all retries');
};

if (!AZURE_AISEARCH_ENDPOINT || !AZURE_AISEARCH_KEY) {
    throw new Error("Azure Search endpoint and key must be set as environment variables");
}

// Function to split document content into chunks using RecursiveCharacterTextSplitter
export const splitDocumentIntoChunks = async (docs: Document[]) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 7000,
        chunkOverlap: 200,
    });

    const splitDocuments = await splitter.splitDocuments(docs);
    return splitDocuments.map((chunk, index) => ({
        index,
        text: chunk.pageContent,
        wordCount: chunk.pageContent.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: chunk.pageContent.length,
        pageNumber: chunk.metadata?.loc.pageNumber,
    }));
};

const createVectorStore = async (openAIApiKey: string) => {
    const embeddingModel = new OpenAIEmbeddings({ apiKey: openAIApiKey });
    return new AzureAISearchVectorStore(embeddingModel, {
        endpoint: AZURE_AISEARCH_ENDPOINT,
        key: AZURE_AISEARCH_KEY,
        indexName: 'vectorsearch',
        search: { type: AzureAISearchQueryType.SemanticHybrid },
    });
};

const mapChunksToDocuments = async (textChunks: any[], documentId: string, teamId: string, title: string) => {
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

export const addMetadataToPDFDocuments = async (
    documents,       // Array of Documents (single pages of PDF)
    documentId,      // Unique ID for the document
    teamId,          // Team ID
    title            // Title of the document
) => {
    // Iterate over each document (representing a single page) and add metadata
    return await Promise.all(documents.map(async (document, index) => {
        const pageNumber = index + 1; // Assuming pageNumber starts at 1
        const wordCount = document.pageContent.split(/\s+/).filter(word => word.length > 0).length;
        const characterCount = document.pageContent.length;

        // Create new attributes
        const newAttributes = [
            { key: 'documentId', value: documentId },
            { key: 'teamId', value: teamId },
            { key: 'title', value: title },
            { key: 'chunkIndex', value: index.toString() },
            { key: 'wordCount', value: wordCount.toString() },
            { key: 'characterCount', value: characterCount.toString() },
            { key: 'pageNumber', value: pageNumber.toString() }
        ];

        // Extract existing metadata, if any
        const existingMetadata = document.metadata || {};
        const existingAttributes = existingMetadata.attributes || [];

        // Merge existing attributes with new attributes
        const mergedAttributes = [...existingAttributes, ...newAttributes];

        // Return the updated document with merged metadata
        return {
            ...document,
            metadata: {
                source: existingMetadata.source || 'Document', // Preserve existing source or default to 'Document'
                attributes: mergedAttributes
            }
        };
    }));
};

export const vectorizeChunks = async (documentId: string, teamId: string, title: string, content: string, mimeType: string) => {
    try {
        const aiKeys = await getAIKeysForTeam(teamId);
        if (!aiKeys.openAIKey && !aiKeys.geminiKey) {
            throw new Error(`No AI API keys found for team ID: ${teamId}`);
        }

        const docs = await loadDocumentContent(content, mimeType);
        const vectorStore = await createVectorStore(aiKeys.openAIKey!);

        if (mimeType === 'application/pdf') {
            // If PDF has less than 3 pages, combine into single chunk
            if (docs.length < 3) {
                const combinedContent = docs.map(doc => doc.pageContent).join('\n\n');
                const combinedDoc = new Document({
                    pageContent: combinedContent,
                    metadata: {
                        source: 'Document',
                        attributes: [
                            { key: 'documentId', value: documentId },
                            { key: 'teamId', value: teamId },
                            { key: 'title', value: title },
                            { key: 'chunkIndex', value: '0' },
                            { key: 'wordCount', value: combinedContent.split(/\s+/).filter(word => word.length > 0).length.toString() },
                            { key: 'characterCount', value: combinedContent.length.toString() },
                            { key: 'pageCount', value: docs.length.toString() }
                        ],
                    },
                });
                await vectorStore.addDocuments([combinedDoc]);
            } else {
                // For larger PDFs, process normally
                const textChunks = await splitDocumentIntoChunks(docs);
                const documents = await mapChunksToDocuments(textChunks, documentId, teamId, title);
                await vectorStore.addDocuments(documents);
            }
        } else {
            // Handle non-PDF documents as before
            const textChunks = await splitDocumentIntoChunks(docs);
            const documents = await mapChunksToDocuments(textChunks, documentId, teamId, title);
            await vectorStore.addDocuments(documents);
        }
    } catch (error) {
        console.error('Error vectorizing chunks:', error);
        throw error;
    }
};

// Function to delay execution for a specified number of milliseconds
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getVectorsForDocumentFromVectorDB = async (documentId: string, teamId: string) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    try {
        const aiKeys = await getAIKeysForTeam(teamId);
        if (!aiKeys.openAIKey) {
            throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
        }

        const vectorStore = await createVectorStore(aiKeys.openAIKey);

        // Retry logic
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            // Fetch vectors for the given documentId
            const filter: AzureAISearchFilterType = {
                filterExpression: `metadata/attributes/any(attr: attr/key eq 'documentId' and attr/value eq '${documentId}')`, includeEmbeddings: true,
            };

            const results = await vectorStore.similaritySearch("", 10000, filter);

            if (results.length > 0) {
                return results.map(result => ({
                    content: result.pageContent,
                    metadata: result.metadata,
                }));
            }

            console.warn(`Attempt ${attempt} failed getVectorsForDocumentFromVectorDB(), retrying in ${RETRY_DELAY}ms...`);
            await delay(RETRY_DELAY);
        }

        throw new Error(`Failed to retrieve vectors for document ID: ${documentId} after ${MAX_RETRIES} attempts`);

    } catch (error) {
        console.error('Error retrieving vectors:', error);
        throw error;
    }
};

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

export const deleteVectorsFromVectorDB = async (documentId: string, teamId: string) => {
    try {
        const aiKeys = await getAIKeysForTeam(teamId);
        if (!aiKeys.openAIKey) {
            throw new Error(`OpenAI API key not found for team ID: ${teamId}`);
        }

        const vectorStore = await createVectorStore(aiKeys.openAIKey);

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