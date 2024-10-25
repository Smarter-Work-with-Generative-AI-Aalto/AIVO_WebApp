//components/documentStore/DocumentStore.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import toast from 'react-hot-toast';
import Error from '@/components/shared/Error';
import Loading from '@/components/shared/Loading';
import Card from '@/components/shared/Card';
import { TableBodyType } from '@/components/shared/table/TableBody';
import UploadDocument from './UploadDocument';
import DocumentTable from './DocumentTable';

const DocumentStore = ({ team }: { team: any }) => {
    const { t } = useTranslation('common');
    const [documents, setDocuments] = useState<TableBodyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/documents?teamId=${team.id}`)
            .then((response) => {
                if (!response.ok) {
                    throw Error(`Failed to fetch documents`);
                }
                return response.json();
            })
            .then((data) => {
                setDocuments(
                    data.map((doc: any) => ({
                        id: doc.id,
                        cells: [
                            { text: new Date(doc.createdAt).toLocaleDateString() },
                            { text: doc.title.length > 100 ? `${doc.title.substring(0, 70)}...` : doc.title },
                            { text: doc.status },
                        ],
                        fileUrl: doc.content,
                    }))
                );
                setError(null);
            })
            .catch((error) => {
                console.error('Error fetching documents:', error);
                toast.error(t('failed-to-fetch-documents'));
                setError(`Failed to load documents. Please try again later.`);
            })
            .finally(() => setIsLoading(false));
    }, [team.id]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const MAX_FILES = 5;
        const MAX_SIZE_MB = 5;

        if (files.length > MAX_FILES) {
            setError(`You can only upload a maximum of ${MAX_FILES} files at a time.`);
            return;
        }

        if (!files) return;

        for (const file of files) {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`A single file cannot exceed ${MAX_SIZE_MB} MBs`);
                return;
            }
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('type', file.type);
        });

        formData.append('teamId', team.id);
        formData.append('status', 'Uploaded');

        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw Error('Failed to upload document');
            }

            const data = await response.json();
            setDocuments((prevDocuments) => [
                ...prevDocuments,
                ...data.map((doc: any) => ({
                    id: doc.id,
                    cells: [
                        { text: new Date(doc.createdAt).toLocaleDateString() },
                        { text: doc.title.length > 70 ? `${doc.title.substring(0, 70)}...` : doc.title },
                        { text: doc.status },
                    ],
                    fileUrl: doc.content,
                })),
            ]);
            setError(null);
            toast.success(t('document-uploaded-successfully'))
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error(t('failed-to-upload-document'));
            setError(`Failed to upload document. Please try again later.`);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        try {
            const response = await fetch('/api/documents', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw Error('Failed to delete document');
            }

            setDocuments((prevDocuments) => prevDocuments.filter((doc) => doc.id !== id));
            setError(null);
            toast.success(t('document-deleted-successfully'))
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error(t('Failed to delete document'));
            setError(`Failed to delete document. Please try again later.`);
        }
    };

    const handleDownloadDocument = (fileUrl: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileUrl.split('/').pop() || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('document-downloaded'));
    };

    return (
        <div className="flex flex-col pb-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
                {t('documentStore.title')}
            </h2>
            {error && <Error message={error} />}
            <UploadDocument handleFileUpload={handleFileUpload} />
            <Card className="mt-6">
                <Card.Body>
                    {isLoading ? (
                        <Loading />
                    ) : documents.length === 0 ? (
                        <p>{t('documentStore.noDocuments')}</p>
                    ) : (
                        <DocumentTable
                            documents={documents}
                            onDelete={handleDeleteDocument}
                            onDownload={handleDownloadDocument}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default DocumentStore;
