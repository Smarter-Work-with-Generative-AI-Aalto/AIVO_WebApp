// components/activityLog/ActivityLogTable.tsx
import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Table } from '../shared/table/Table';
import { IoOpenOutline } from "react-icons/io5";
import { TrashIcon } from '@heroicons/react/24/outline';
import { BsDownload } from "react-icons/bs";
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

interface ActivityLogTableProps {
    activities: any[];
    onViewResults: (id: string) => void;
    onDelete: (id: string) => void;
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ activities, onViewResults, onDelete }) => {
    const { t } = useTranslation('common');
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    
    const columns = [
        '',  // Checkbox column
        t('activityLog.table.date'),
        t('activityLog.table.query'),
        t('activityLog.table.status'),
        'Actions',
    ];

    const handleSelectActivity = (id: string) => {
        setSelectedActivities(prev =>
            prev.includes(id)
                ? prev.filter(actId => actId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedActivities.length === activities.length) {
            setSelectedActivities([]);
        } else {
            setSelectedActivities(activities.map(act => act.id));
        }
    };

    const downloadExcel = async () => {
        if (selectedActivities.length === 0) {
            toast.error(t('select-activities-to-export'));
            return;
        }

        try {
            toast.loading(t('preparing-export'));

            // Fetch all selected results
            const selectedResults = await Promise.all(
                selectedActivities.map(async (id) => {
                    const response = await fetch(`/api/ai-research/${id}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch results for activity ${id}`);
                    }
                    return response.json();
                })
            );

            // Create a map to store unique chunks and their results
            const chunkMap = new Map();
            const searchQueries = selectedResults.map(result => result.userSearchQuery);

            // Process each result and organize by chunk
            selectedResults.forEach((result, queryIndex) => {
                result.individualFindings.forEach(finding => {
                    const chunkKey = `${finding.title}_${finding.page}_${finding.pageContent}`;
                    
                    if (!chunkMap.has(chunkKey)) {
                        // Initialize new chunk entry
                        chunkMap.set(chunkKey, {
                            sourceFile: finding.title,
                            pageNumber: finding.page,
                            originalText: finding.pageContent || '',
                            results: new Array(selectedResults.length).fill('') // Initialize array for all possible queries
                        });
                    }

                    // Add the result for this query
                    const chunkData = chunkMap.get(chunkKey);
                    chunkData.results[queryIndex] = finding.content;
                });
            });

            // Convert map to array for Excel
            const worksheetData = Array.from(chunkMap.values());

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();

            // Create headers array with dynamic query columns
            const headers = [
                'Source File',
                'Page Number',
                'Original Text',
                ...searchQueries.map((query, index) => `${query} (${index + 1})`)
            ];

            // Convert data to the format needed for Excel
            const excelData = worksheetData.map(row => ({
                'Source File': row.sourceFile,
                'Page Number': row.pageNumber,
                'Original Text': row.originalText,
                ...row.results.reduce((acc, result, index) => ({
                    ...acc,
                    [`${searchQueries[index]} (${index + 1})`]: result
                }), {})
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData, {
                header: headers
            });

            // Adjust column widths
            const columnWidths = headers.map(header => ({
                wch: Math.min(
                    Math.max(
                        header.length,
                        ...excelData.map(row => String(row[header] || '').length)
                    ),
                    100 // Maximum width
                )
            }));
            worksheet['!cols'] = columnWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Research Results');

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data = new Blob(
                [excelBuffer], 
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            );
            
            // Download file
            saveAs(data, `Research_Results_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.dismiss();
            toast.success(t('export-successful'));
        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss();
            toast.error(t('export-failed'));
        }
    };

    return (
        <div>
            {selectedActivities.length > 0 && (
                <div className="mb-4 flex justify-end">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-neutral btn-sm m-1">
                            <BsDownload className="h-5 w-5 mr-2" />
                            {t('export')} ({selectedActivities.length})
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu z-50 p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a onClick={downloadExcel}>Excel</a></li>
                        </ul>
                    </div>
                </div>
            )}
            <Table
                cols={columns}
                body={activities.map((activity) => ({
                    id: activity.id, // Ensure unique key
                    cells: [
                        {
                            element: (
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={selectedActivities.includes(activity.id)}
                                    onChange={() => handleSelectActivity(activity.id)}
                                />
                            ),
                        },
                        { text: new Date(activity.createdAt).toLocaleDateString() },
                        {
                            text: activity.userSearchQuery.length > 70
                                ? `${activity.userSearchQuery.substring(0, 70)}...`
                                : activity.userSearchQuery
                        },
                        { text: activity.status },
                        {
                            element: (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onViewResults(activity.id)}
                                        className="text-blue-500 flex items-center"
                                    >
                                        <IoOpenOutline className="w-5 h-5 ml-2" />
                                    </button>
                                    <button onClick={() => onDelete(activity.id)}
                                        className="text-red-500 flex items-center"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ),
                        },
                    ],
                }))}
                noMoreResults={activities.length === 0}
            />
        </div>
    );
};

export default ActivityLogTable;
