//components/documentStore/UploadDocument.tsx
import { useTranslation } from 'next-i18next';
import Card from '@/components/shared/Card';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface UploadDocumentProps {
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadDocument: React.FC<UploadDocumentProps> = ({ handleFileUpload }) => {
    const { t } = useTranslation('common');

    return (

        <div className="card w-full border-none border-rounded dark:bg-black dark:border-gray-600">
            <Card.Body>
                <div className="border-2 border-dashed border-gray-300 p-4 mb-4 text-center rounded-lg">
                    <input
                        type="file"
                        className="hidden"
                        id="fileUpload"
                        accept=".pdf,.txt,.rtf,.doc,.docx"
                        multiple
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center h-full">
                            <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                            <span className="mt-2 block text-sm font-medium text-gray-600">{t('documentStore.uploadPrompt')}</span>
                        </div>
                    </label>
                    <button className="btn btn-neutral mt-4 w-full rounded-full">{t('documentStore.uploadButton')}</button>
                </div>
            </Card.Body>
        </div>

    );
};

export default UploadDocument;
