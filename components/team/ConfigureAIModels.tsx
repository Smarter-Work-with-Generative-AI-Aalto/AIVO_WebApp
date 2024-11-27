import { Card, InputWithLabel, Loading, Error } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import { useFormik } from 'formik';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import { AiModelSchema } from '@/lib/zod';
import { z } from 'zod';
import { AccessControl } from '../shared/AccessControl';

// console.log('ConfigureAIModels component loaded');

interface AIModel {
    id: string;
    teamId: string;
    provider: string;
    azureOpenAIApiDeploymentName?: string;
    azureOpenAIApiVersion?: string;
    azureOpenAIBasePath?: string;
    azureOpenAIApiKey?: string;
    openAIApiKey?: string;
    googleAIApiKey?: string;
    createdAt: string;
    updatedAt: string;
}

const ConfigureAIModels = ({ team }) => {
    const { t } = useTranslation('common');
    const [aiModels, setAiModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAIModels: () => Promise<void> = async () => {
            try {
                const response = await fetch(`/api/teams/${team.slug}/ai-models`, {
                    headers: defaultHeaders,
                });

                if (!response.ok) {
                    toast.error(t('failed-to-fetch-ai-models'));
                    // There is some problem here, throwing the error didnt work!
                    //                    throw new Error("Failed to fetch AI models");
                }

                const json = await response.json();
                setAiModels(json.data);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAIModels();
    }, [team.slug]);

    // Assuming there should be only one AI model per team
    const aiModel = aiModels.length > 0 ? aiModels[0] : null;

    const formik = useFormik<z.infer<typeof AiModelSchema>>({
        initialValues: {
            provider: aiModel?.provider || '',
            azureOpenAIApiDeploymentName: aiModel?.azureOpenAIApiDeploymentName || '',
            azureOpenAIApiVersion: aiModel?.azureOpenAIApiVersion || '',
            azureOpenAIBasePath: aiModel?.azureOpenAIBasePath || '',
            azureOpenAIApiKey: aiModel?.azureOpenAIApiKey || '',
            openAIApiKey: aiModel?.openAIApiKey || '',
            googleAIApiKey: aiModel?.googleAIApiKey || '',
        },
        validateOnBlur: false,
        enableReinitialize: true,
        validate: (values) => {
            const errors: any = {};
            if (!values.provider) {
                errors.provider = t('provider is required');
            }
            if (values.provider === 'Azure OpenAI') {
                if (!values.azureOpenAIApiKey) {
                    errors.azureOpenAIApiKey = t('Azure OpenAI API Key is required');
                }
            } else if (values.provider === 'OpenAI') {
                if (!values.openAIApiKey) {
                    errors.openAIApiKey = t('OpenAI API Key is required');
                }
            } else if (values.provider === 'Google Gemini') {
                if (!values.googleAIApiKey) {
                    errors.googleAIApiKey = t('Google Gemini API Key is required');
                }
            }
            return errors;
        },
        onSubmit: async (values) => {
            try {
                const response = await fetch(`/api/teams/${team.slug}/ai-models`, {
                    method: 'POST',
                    headers: defaultHeaders,
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    toast.error(response.statusText);
                    return;
                }

                const json = await response.json();
                toast.success(t('successfully-updated'));
                //setAiModels((prev) => [...prev, json.data]);
                setAiModels([json.data]); // Assuming one AI model per team
                formik.resetForm();
            } catch (error: any) {
                toast.error(error.message);
            }
        },
    });

    const maskApiKey = (key: string) => {
        if (key.length <= 4) return '****';
        return key;
        //return '****' + key.slice(-4);
    };

    const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

    const toggleShowKey = (id: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const providerSpecificFields = () => {
        switch (formik.values.provider) {
            case 'Azure OpenAI':
                return (
                    <>
                        <InputWithLabel
                            name="azureOpenAIApiDeploymentName"
                            label={t('azure-openai-deployment-name')}
                            value={formik.values.azureOpenAIApiDeploymentName}
                            onChange={formik.handleChange}
                            error={formik.errors.azureOpenAIApiDeploymentName}
                        />
                        <InputWithLabel
                            name="azureOpenAIApiVersion"
                            label={t('azure-openai-api-version')}
                            value={formik.values.azureOpenAIApiVersion}
                            onChange={formik.handleChange}
                            error={formik.errors.azureOpenAIApiVersion}
                        />
                        <InputWithLabel
                            name="azureOpenAIBasePath"
                            label={t('azure-openai-base-path')}
                            value={formik.values.azureOpenAIBasePath}
                            onChange={formik.handleChange}
                            error={formik.errors.azureOpenAIBasePath}
                        />
                        <div className="relative">
                            <InputWithLabel
                                name="azureOpenAIApiKey"
                                label={t('azure-openai-api-key')}
                                type={showKeys['azure'] ? 'text' : 'password'}
                                value={formik.values.azureOpenAIApiKey}
                                onChange={formik.handleChange}
                                error={formik.errors.azureOpenAIApiKey}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowKey('azure')}
                                className="absolute right-3 top-9 text-gray-500 focus:outline-none"
                            >
                                {showKeys['azure'] ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </>
                );
            case 'OpenAI':
                return (
                    <div className="relative">
                        <InputWithLabel
                            name="openAIApiKey"
                            label={t('openai-api-key')}
                            type={showKeys['openai'] ? 'text' : 'password'}
                            value={formik.values.openAIApiKey}
                            onChange={formik.handleChange}
                            error={formik.errors.openAIApiKey}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowKey('openai')}
                            className="absolute right-3 top-9 text-gray-500 focus:outline-none"
                        >
                            {showKeys['openai'] ? 'Hide' : 'Show'}
                        </button>
                    </div>
                );
            case 'Google Gemini':
                return (
                    <div className="relative">
                        <InputWithLabel
                            name="googleAIApiKey"
                            label={t('google-gemini-api-key')}
                            type={showKeys['google'] ? 'text' : 'password'}
                            value={formik.values.googleAIApiKey}
                            onChange={formik.handleChange}
                            error={formik.errors.googleAIApiKey}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => toggleShowKey('google')}
                            className="absolute right-3 top-9 text-gray-500 focus:outline-none"
                        >
                            {showKeys['google'] ? 'Hide' : 'Show'}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return <Loading />;
    if (error) return <Error message={error} />;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">{t('configure-ai-models')}</h2>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
                <Card>
                    <Card.Body>
                        <div className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label">{t('provider')}</label>
                                <select
                                    name="provider"
                                    value={formik.values.provider}
                                    onChange={formik.handleChange}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="">{t('select-provider')}</option>
                                    <option value="Azure OpenAI">{t('azure-openai')}</option>
                                    <option value="OpenAI">{t('openai')}</option>
                                    <option value="Google Gemini">{t('google-gemini')}</option>
                                </select>
                                {formik.errors.provider && (
                                    <div className="text-red-500">{formik.errors.provider}</div>
                                )}
                            </div>
                            {providerSpecificFields()}
                        </div>
                    </Card.Body>
                    <AccessControl resource="team_ai_model" actions={['create']}>
                        <Card.Footer>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    color="primary"
                                    loading={formik.isSubmitting}
                                    disabled={!formik.isValid || !formik.dirty}
                                    size="md"
                                >
                                    {t('save')}
                                </Button>
                            </div>
                        </Card.Footer>
                    </AccessControl>
                </Card>
            </form>
            <div className="mt-8">
                <h3 className="text-xl font-semibold">{t('existing-configurations')}</h3>
                <ul className="list-disc ml-6">
                    {aiModels.map((config) => (
                        <li key={config.id} className="flex items-center space-x-2">
                            <span>{config.provider} - </span>
                            <span>
                                {config.provider === 'Azure OpenAI' && maskApiKey(config.azureOpenAIApiKey || '')}
                                {config.provider === 'OpenAI' && maskApiKey(config.openAIApiKey || '')}
                                {config.provider === 'Google Gemini' && maskApiKey(config.googleAIApiKey || '')}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        config.provider === 'Azure OpenAI'
                                            ? config.azureOpenAIApiKey || ''
                                            : config.provider === 'OpenAI'
                                            ? config.openAIApiKey || ''
                                            : config.googleAIApiKey || ''
                                    );
                                    toast.success(t('copied-to-clipboard'));
                                }}
                                className="text-blue-500 hover:underline"
                            >
                                {t('copy-to-clipboard')}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ConfigureAIModels;
