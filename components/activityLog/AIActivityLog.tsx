// components/activityLog/ActivityLog.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Loading from '../shared/Loading';
import Error from '../shared/Error';
import toast from 'react-hot-toast';
import Card from '../shared/Card';
import ActivityLogTable from './ActivityLogTable';
// import { formatDate } from '@/utils/formatDate'; // Assuming you have a date formatting utility

interface ActivityLogProps {
    teamId: string;
    teamSlug: string;  // Add teamSlug as a prop
}

const ActivityLog: React.FC<ActivityLogProps> = ({ teamId, teamSlug }) => {  // Include teamSlug in props
    const { t } = useTranslation('common');
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/ai-activity-log?teamId=${teamId}`);
                if (!response.ok) {
                    toast.error(t('failed-to-delete-activity'));
                    throw Error;
                }
                const data = await response.json();
                setActivities(data);
            } catch (error) {
                console.error('Error fetching activity log:', error);
                toast.error(t('failed-to-fetch-activity-log'));
                setError(`Failed to load activities. Please try again later.`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchActivities();
    }, [teamId]);

    const handleDeleteActivity = async (id: string) => {
        try {
            const response = await fetch(`/api/ai-activity-log`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(t('failed-to-delete-activity'));
                throw Error;
            }

            setActivities((prevActivities) => 
                prevActivities.filter((activity) => activity.id !== id)
            );
            toast.success(t('activity-deleted-successfully'));
        } catch (error) {
            console.error('Error deleting activity:', error);
            toast.error(t('failed-to-delete-activity'));
            setError(error instanceof Error ? error.message : 'Failed to delete activity');
        }
    };

    const handleViewResults = (activityId: string) => {
        // Use teamSlug for the redirection
        window.location.href = `/teams/${teamSlug}/ai-result?id=${activityId}`;
    };

    return (
        <div className="flex flex-col pb-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
                {t('activityLog.title')}
            </h2>
            {error && <Error message={error} />}
            <div className="mt-6">
                <Card>
                    <Card.Body>
                        {isLoading ? (
                            <Loading />
                        ) : activities.length === 0 ? (
                            <p>{t('activityLog.noActivities')}</p>
                        ) : (
                            <ActivityLogTable 
                                activities={activities} 
                                onViewResults={handleViewResults} 
                                onDelete={handleDeleteActivity} 
                            />
                        )}
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default ActivityLog;