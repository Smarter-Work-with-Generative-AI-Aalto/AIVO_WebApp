// components/ResearchSummary.tsx
import React, { useState } from 'react';
import Card from '../shared/Card';
import { useTranslation } from 'react-i18next';
import { IoCopyOutline } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';

const ResearchSummary = ({ summary, sources }) => {
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
        <div className="shadow-xl">
            <Card>
                <Card.Body>
                    <div className="flex justify-between items-start">
                        <Card.Header>
                            <Card.Title>{t('overall-summary')}</Card.Title>
                            <Card.Description><div className="text-m"><ReactMarkdown>{summary.summary}</ReactMarkdown></div></Card.Description>
                        </Card.Header>
                        <div className="tooltip" data-tip={tooltipText}>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => copyToClipboard(summary.summary)}
                            >
                                <IoCopyOutline className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mt-4">{t('sources')}</h3>
                        <ul className="list-none list-inside text-sm">
                            {/* Ensure that sources is an array before using map */}
                            {sources && sources.length > 0 ? (
                                sources.map((source, index) => (
                                    <li key={index} className="text-gray-500">
                                        {t('[')}{t(source.reference)}{t(']')}    {t(source.title)} - <span className="text-gray-500">{source.page} </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500">{t('No sources available')}</li>
                            )}
                        </ul>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ResearchSummary;
