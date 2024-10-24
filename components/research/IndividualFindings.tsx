// components/research/IndividualFindings.tsx
import React, { useState } from 'react';
import Card from '../shared/Card';
import { useTranslation } from 'react-i18next';
import { BsFileEarmarkText } from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';

const getFileIcon = () => {
  return <BsFileEarmarkText className="text-4xl" />;
};

const IndividualFindings = ({ findings }) => {
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
      <h2 className="text-xl font-semibold mb-4 mt-8">{t('individual-findings')}</h2>
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
            <p><ReactMarkdown>{t(finding.content)}</ReactMarkdown></p>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default IndividualFindings;
