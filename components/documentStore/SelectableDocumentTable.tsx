//components/documentStore/SelectableDocumentTable.tsx
import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface Document {
  id: string;
  title: string;
  status: string;
  uploadDate: string;
}

interface DocumentTableProps {
  documents: Document[];
  selectedDocuments: string[];
  onSelect: (documentId: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, selectedDocuments, onSelect }) => {
  const { t } = useTranslation('common');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSelectAll = () => {
    documents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).forEach((doc) => onSelect(doc.id));
  };

  const paginatedDocuments = documents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="table table-xs w-full">
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" onChange={handleSelectAll} />
                </label>
              </th>
              <th>{t('documentStore.table.title')}</th>
              <th>{t('documentStore.table.status')}</th>
              <th>{t('documentStore.table.uploadDate')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.map((doc) => (
              <tr
                key={doc.id}
                className={selectedDocuments.includes(doc.id) ? 'bg-gray-200' : ''}
              >
                <td>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => onSelect(doc.id)}
                    />
                  </label>
                </td>
                <td>{doc.title}</td>
                <td>{doc.status}</td>
                <td>{doc.uploadDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="join flex justify-between items-center mt-4">
        <div>
          <button className="join-item btn btn-xs" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          {t('previous')}
          </button>
          <button className="join-item btn btn-xs" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          {t('next')}
          </button>
        </div>
        <div>
          {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
};

export default DocumentTable;
