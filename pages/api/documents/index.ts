// pages/api/documents/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import { BlobServiceClient } from '@azure/storage-blob';
import { createDocument, getDocumentsByTeam, getDocumentsByStatus, deleteDocument, getDocument } from 'models/document';
import { updateDocument } from 'models/document';
import { vectorizeChunks, getVectorsForDocumentFromVectorDB, addVectorsInPrismaDB, deleteVectorsFromVectorDB, deleteVectorsFromPrismaDB } from '@/lib/vectorization';
import os from 'os';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Use OS temp directory for temporary file uploads
const uploadsDir = os.tmpdir();

// Ensure the uploads directory exists
// const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
//     fs.chmodSync(uploadsDir, '0777');
// }

const deleteFromLocal = (filePath) => {
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    } else {
        console.log('file not found in local');
    }
};

const uploadToS3 = async (file) => {
    const s3 = new AWS.S3();
    const fileContent = fs.readFileSync(file.filepath);
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: file.originalFilename,
        Body: fileContent,
    };
    const data = await s3.upload(params).promise();
    fs.unlinkSync(file.filepath);
    return data.Location;
};

const deleteFromS3 = async (fileKey) => {
    const s3 = new AWS.S3();
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
    };
    await s3.deleteObject(params).promise();
    console.log('deleted from S3');
};

const uploadToAzure = async (file) => {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error('Azure Storage connection string is not configured');
    }
    
    try {
        // Log connection string format (remove sensitive data)
        const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        console.log('Connection string format check:', 
            connString.startsWith('DefaultEndpointsProtocol=https'));
        
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        
        // Create container if it doesn't exist
        const containerName = 'aivodocumentstore'; // or any other container name you want to use
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists(
            {
                access: 'container'
            }
        );
        
        // Generate a unique filename to prevent overwrites
        const uniqueFileName = `${Date.now()}-${file.originalFilename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
        
        // Upload the file
        const fileContent = fs.readFileSync(file.filepath);
        await blockBlobClient.upload(fileContent, fileContent.length, {
            blobHTTPHeaders: {
                blobContentType: file.mimetype
            }
        });
        
        // Clean up the temporary file
        fs.unlinkSync(file.filepath);
        
        return blockBlobClient.url;
    } catch (error) {
        console.error('Error uploading to Azure:', error);
        throw new Error('Failed to upload file to Azure Storage');
    }
};

const deleteFromAzure = async (fileUrl: string) => {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error('Azure Storage connection string is not configured');
    }
    
    try {
        const connString = process.env.AZURE_STORAGE_CONNECTION_STRING.replace(/["']/g, '');
        const blobServiceClient = BlobServiceClient.fromConnectionString(connString);
        
        // Extract container name and blob name from URL
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        const containerName = pathParts[1];  // 'aivodocumentstore'
        const blobName = pathParts.slice(2).join('/');  // actual filename
        
        console.log('Deleting blob:', { containerName, blobName });
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.delete();
        console.log('Successfully deleted from Azure:', blobName);
    } catch (error) {
        console.error('Error deleting from Azure:', error);
        throw error;
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                return await getDocuments(req, res);
            case 'POST':
                return await createDocumentHandler(req, res);
            case 'DELETE':
                return await deleteDocumentHandler(req, res);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error handling request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

async function getDocuments(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { teamId, status } = req.query;
    if (!teamId) {
        return res.status(400).json({ message: 'teamId is required' });
    }

    try {
        let documents;
        if (status) {
            documents = await getDocumentsByStatus(String(teamId), String(status));
        } else {
            documents = await getDocumentsByTeam(String(teamId));
        }
        return res.status(200).json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ message: 'Error fetching documents' });
    }
}

async function createDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const form = new IncomingForm({
        multiples: true,
        keepExtensions: true, // Keep the file extension
        uploadDir: uploadsDir,
        maxFileSize: 5 * 1024 * 1024, // 10MB
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ message: 'Error parsing form' });
        }

        const { teamId, title, status, type } = fields;
        if (!teamId || !title || !status || !type) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const uploadedFiles = files.file instanceof Array ? files.file : [files.file];
        const documentsArray = [];

        for (const file of uploadedFiles) {
            // const newFilepath = path.join(uploadsDir, file.newFilename);
            // fs.renameSync(file.filepath, newFilepath);

            // let fileUrl = '';
            // if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            //     fileUrl = await uploadToS3(file);
            // } else if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCESS_KEY) {
            //     fileUrl = await uploadToAzure(file);
            // } else {
            //     fileUrl = `/uploads/${file.newFilename}`;

            try {
                // Upload to Azure Blob Storage
                const uniqueFileName = `${Date.now()}-${file.originalFilename}`;
                const fileUrl = await uploadToAzure({
                    ...file,
                    originalFilename: uniqueFileName
                });

                const newDocument = await createDocument({
                    teamId: String(teamId),
                    title: `${file.originalFilename}`,
                    fileName: `${uniqueFileName}`,
                    content: fileUrl,
                    status: 'Uploaded',
                    type: String(file.mimetype),
                });
                documentsArray.push(newDocument);

                // Update the document status to 'Vectorizing'
                await updateDocument({
                    where: { id: newDocument.id },
                    data: { status: 'Vectorizing' }
                });

                // Split the document into chunks, vectorize them using OpenAI Embeddings, upload to Azure Vector Store
                await vectorizeChunks(newDocument.id, newDocument.teamId, newDocument.title, newDocument.content, newDocument.type);

                const vectors = await getVectorsForDocumentFromVectorDB(newDocument.id, newDocument.teamId);

                await addVectorsInPrismaDB(vectors, newDocument.id);

                // Update the document status to 'Ready'
                await updateDocument({
                    where: { id: newDocument.id },
                    data: { status: 'Ready' }
                });

                console.log('Document Vectorization Completed');
            } catch (error) {
                console.error('Error Uploading Document:', error);
                return res.status(500).json({ message: 'Error Uploading Document' });
            }
        }

        return res.status(201).json(documentsArray);
    });
}

async function deleteDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    let body = '';

    // Read the request body
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { id } = JSON.parse(body);
            if (!id) {
                return res.status(400).json({ message: 'Document ID is required' });
            }

            const document = await getDocument({ id });

            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }

            try {
                // // Delete the document from the storage
                // if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                //     await deleteFromS3(document.fileName);
                // } else if (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_ACCESS_KEY) {
                //     await deleteFromAzure(document.fileName);
                // } else {
                //     deleteFromLocal(document.fileName);
                // }

                // Delete from Azure Blob Storage
                await deleteFromAzure(document.content);
                
                // Delete vector embeddings from vector DB
                await deleteVectorsFromVectorDB(document.id, document.teamId);

                // Delete vector embeddings from Prisma DB
                await deleteVectorsFromPrismaDB(document.id);

                // Delete the document from the database
                await deleteDocument({ id: String(id) });

                return res.status(204).end();
            } catch (error) {
                console.error('Error deleting document:', error);
                return res.status(500).json({ message: 'Error deleting document' });
            }
        } catch (error) {
            console.error('Error parsing JSON body:', error);
            return res.status(400).json({ message: 'Invalid JSON' });
        }
    });
}