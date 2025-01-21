//components/documentStore/UploadDocument.tsx
import { useTranslation } from 'next-i18next';
import Card from '@/components/shared/Card';
//import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { FileUpload } from '@/components/ui/file-upload';
import { useState } from 'react';

interface UploadDocumentProps {
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({ handleFileUpload }) => {
    const { t } = useTranslation('common');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = (files: File[]) => {
        setSelectedFiles(files);
    };

    const handleUpload = (files: File[]) => {
        // Create a synthetic event to match the existing handleFileUpload signature
        const syntheticEvent = {
            target: {
                files: files
            }
        } as React.ChangeEvent<HTMLInputElement>;

        handleFileUpload(syntheticEvent);
    };

    return (
        <div className="card w-full border-none border-rounded dark:bg-black dark:border-gray-600">
            <Card.Body>
                <FileUpload
                    onChange={handleFileChange}
                    onUpload={handleUpload}
                />
                {/* <div className="border-2 border-dashed border-gray-300 p-4 mb-4 text-center rounded-lg">
                    <input
                        type="file"
                        className="hidden"
                        id="fileUpload"
                        accept=".pdf,.txt,.rtf,.doc,.docx"
                        multiple
                        onChange={handleFileChange}
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center h-full">
                            <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                            <span className="mt-2 block text-sm font-medium text-gray-600">{t('documentStore.uploadPrompt')}</span>
                        </div>
                    </label>
                    <FileUpload 
                        onChange={handleFileChange}
                        onUpload={handleUpload}
                    />
                </div> */}
            </Card.Body>
        </div>
    );
};

export default UploadDocument;
