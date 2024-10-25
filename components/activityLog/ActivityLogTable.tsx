// components/activityLog/ActivityLogTable.tsx
import React from 'react';
import { useTranslation } from 'next-i18next';
import { Table } from '../shared/table/Table';
import { IoOpenOutline } from "react-icons/io5";
import { TrashIcon } from '@heroicons/react/24/outline';

interface ActivityLogTableProps {
    activities: any[];
    onViewResults: (id: string) => void;
    onDelete: (id: string) => void;
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ activities, onViewResults, onDelete }) => {
    const { t } = useTranslation('common');

    const columns = [
        t('activityLog.table.date'),
        t('activityLog.table.query'),
        t('activityLog.table.status'),
        'Actions',
    ];

    return (
        <Table
            cols={columns}
            body={activities.map((activity) => ({
                id: activity.id, // Ensure unique key
                cells: [
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
    );
};

export default ActivityLogTable;
