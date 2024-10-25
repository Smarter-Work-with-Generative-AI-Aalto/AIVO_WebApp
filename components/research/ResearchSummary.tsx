// components/ResearchSummary.tsx
import React, { useState } from 'react';
import Card from '../shared/Card';
import { useTranslation } from 'react-i18next';
import { IoCopyOutline } from "react-icons/io5";
import { BsDownload } from "react-icons/bs";
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Query } from 'pg';

const downloadExcel = (results) => {
    if (!results) return;

    // Individual Findings Worksheet
    const findingsData = results.individualFindings.map((finding) => [
        finding.title,            // Source
        finding.page,           // Page Number
        finding.pageContent,    // Original text chunk
        finding.content,        // Result
    ]);

    const findingsSheet = XLSX.utils.aoa_to_sheet([
        ['Source File', 'Page Number', 'Original Text', 'Result of Query: ' + results.userSearchQuery],
        ...findingsData,
    ]);

    // Overall Summary Worksheet
    const overallSheet = XLSX.utils.aoa_to_sheet([
        ['Overall Query', 'Overall Result'],
        [results.overallQuery, results.overallSummary.summary],
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Batch Results');
    XLSX.utils.book_append_sheet(workbook, overallSheet, 'Overall Result');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'AIVO_Research_Results.xlsx');
};

const ResearchSummary = ({ results }) => {
    const { t } = useTranslation('common');
    const [tooltipText, setTooltipText] = useState('copy');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setTooltipText('copied');
            setTimeout(() => setTooltipText('copy'), 5000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    return (
        <>
            <div className="flex justify-between items-start">
                <div className="flex items-center mt-4 mb-2">
                    <div className="flex-column">
                        <div className="badge badge-neutral badge-s rounded-2xl">{t('Overall Result')}</div>
                        <h2 className="text-xl font-semibold mb-2 text-center">
                            {results.overallQuery}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center mt-4 mb-2 dropdown dropdown-bottom dropdown-end dropdown-hover">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                        <BsDownload className="h-5 w-5" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li>
                            <a onClick={() => downloadExcel(results)}>Excel</a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="shadow-xl">
                <Card>
                    <Card.Body>
                        <div className="flex justify-between items-start">
                            <Card.Header>
                                <Card.Description>
                                    <div className="text-m">
                                        <ReactMarkdown>{results.overallSummary.summary}</ReactMarkdown>
                                    </div>
                                </Card.Description>
                            </Card.Header>
                            <div className="tooltip" data-tip={tooltipText}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => copyToClipboard(results.overallSummary.summary)}
                                >
                                    <IoCopyOutline className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mt-4">{t('sources')}</h3>
                            <ul className="list-none list-inside text-sm">
                                {/* Ensure that sources is an array before using map */}
                                {results.sources && results.sources.length > 0 ? (
                                    results.sources.map((source, index) => (
                                        <li key={index} className="text-gray-500">
                                            {t('[')}{t(source.reference)}{t(']')}    {t(source.title)} - <span className="text-gray-500">{source.page} </span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">{t('* feature coming soon *')}</li>
                                )}
                            </ul>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </>
    );
};

export default ResearchSummary;
