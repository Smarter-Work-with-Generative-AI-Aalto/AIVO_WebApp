//components/documentStore/DocumentTable.tsx
import React from 'react';
import { useTranslation } from 'next-i18next';
import { Table } from '@/components/shared/table/Table';
import { TableBodyType } from '@/components/shared/table/TableBody';
import { TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface DocumentTableProps {
  documents: TableBodyType[];
  onDelete: (id: string) => void;
  onDownload: (fileUrl: string) => void; // Add this line
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onDelete, onDownload }) => {
  const { t } = useTranslation('common');

  const columns = [
    t('documentStore.table.uploadDate'),
    t('documentStore.table.title'),
    t('documentStore.table.status'),
    'Actions'
  ];

  return (
    <Table
      cols={columns}
      body={documents.map(doc => ({
        key: doc.id, // Ensure unique key
        ...doc,
        cells: [
          ...doc.cells,
          {
            element: (
              <div className="flex space-x-2">
                <button onClick={() => onDownload(doc.fileUrl)} className="text-blue-500">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(doc.id)} className="text-red-500">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )
          }
        ]
      }))}
      noMoreResults={documents.length === 0}
    />
  );
};

export default DocumentTable;
