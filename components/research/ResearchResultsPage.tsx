// components/research/ResearchResultsPage.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ResearchSummary from '../research/ResearchSummary';
import IndividualFindings from '../research/IndividualFindings';
import LoadingSkeleton from '../research/LoadingSkeleton';
import Error from '../shared/Error';
import toast from 'react-hot-toast';

// Define the shape of your results object
interface ResearchResults {
    overallSummary: string;
    overallQuery: string;
    userSearchQuery: string;
    sources: any[]; // Adjust this to match the type of your sources if needed
    individualFindings: Array<{
        page: string;
        title: string;
        content: string;
    }>;
}

const ResearchResultsPage = ({ resultId }: { resultId: string }) => {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<ResearchResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/ai-research/${resultId}`);
                if (!response.ok) {
                    toast.error('Failed to fetch results');
                }
                const data = await response.json();
                console.log("Result fetched successfully");
                setResults(data);
            } catch (err) {
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [resultId]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <Error message={error} />;

    return (
        <div className="flex flex-col pb-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
                {t('research-results')}
            </h2>
            {error && <Error message={error} />}
            {results && (
                <>
                    <ResearchSummary results = {results} />
                    <IndividualFindings findings={results.individualFindings} userSearchQuery={results.userSearchQuery} />
                </>
            )}
        </div>
    );
};

export default ResearchResultsPage;
