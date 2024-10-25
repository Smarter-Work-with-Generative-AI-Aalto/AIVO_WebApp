// components/research/IndividualFindings.tsx
import React, { useState } from 'react';
import Card from '../shared/Card';
import { useTranslation } from 'react-i18next';
import { BsFileEarmarkText, BsDownload } from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const getFileIcon = () => {
  return <BsFileEarmarkText className="text-4xl" />;
};

const downloadExcel = (findings, userSearchQuery) => {
  const worksheetData = findings.map((finding) => [
    `File ${finding.page}`, // Source
    finding.content,        // Result
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Source', userSearchQuery],
    ...worksheetData,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'ResearchResults.xlsx');
};

const IndividualFindings = ({ findings, userSearchQuery }) => {
  const { t } = useTranslation('common');
  const [tooltipText, setTooltipText] = useState<string[]>(findings.map(() => 'copy'));

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      const newTooltipText = [...tooltipText];
      newTooltipText[index] = 'copied';
      setTooltipText(newTooltipText);

      setTimeout(() => {
        const resetTooltipText = [...tooltipText];
        resetTooltipText[index] = 'copy';
        setTooltipText(resetTooltipText);
      }, 5000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div>
      <div className="flex justify-between items-start">
        <div className="flex items-center mt-4 mb-2">
          <div className="flex-column">
            <div className="badge badge-neutral badge-s rounded-2xl">{t('Batch Results')}</div>
            <h2 className="text-xl font-semibold mb-4">{userSearchQuery}</h2>
          </div>
        </div>
        <div className="flex items-center mb-4 mt-8 dropdown dropdown-bottom dropdown-end dropdown-hover">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
            <BsDownload className="h-5 w-5" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li>
              <a onClick={() => downloadExcel(findings, userSearchQuery)}>Excel</a>
            </li>
          </ul>
        </div>
      </div>
      {findings.map((finding, index) => (
        <Card key={index}>
          <Card.Body>
            <div className="flex justify-between items-start">
              <div className="flex items-center mb-2">
                <div className="mr-2 text-2xl">
                  <span>{getFileIcon()}</span>
                </div>
                <div>
                  <h4 className="font-semibold">{t(finding.title)}</h4>
                  <span className="text-gray-500 text-sm">{t('page')} {finding.page}</span>
                </div>
              </div>
              <div className="tooltip" data-tip={tooltipText[index]}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => copyToClipboard(finding.content, index)}
                >
                  <IoCopyOutline className="h-5 w-5" />
                </button>
              </div>
            </div>
            <ReactMarkdown>{t(finding.content)}</ReactMarkdown>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default IndividualFindings;
