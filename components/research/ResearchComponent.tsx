//components/research/ResearchComponent.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
// import { getUserBySession } from '../../models/user';
// import { useSession } from 'next-auth/react';
import Error from '../shared/Error';
import Loading from '../shared/Loading';
import Card from '../shared/Card';
import { BsFiletypePdf, BsFiletypeTxt, BsFiletypeDoc, BsFiletypePpt, BsFiletypeCsv, BsFileEarmarkText } from "react-icons/bs";
import { IoOpenOutline } from "react-icons/io5";
import { Button } from 'react-daisyui';
import SelectableDocumentTable from '../documentStore/SelectableDocumentTable';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/lib/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { NumberTicker } from "@/lib/components/ui/number-ticker";
import { Search, History, FileText, Zap, Droplet, Clock, DollarSign, Recycle, Hash, Info, ExternalLink } from "lucide-react";
import { MultiStepLoader } from "../ui/multi-step-loader";
import {
    Drawer,
    DrawerTrigger,
    DrawerPortal,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerTitle,
} from "@/lib/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/lib/components/ui/scroll-area";
import { ScrollAreaCorner } from '@radix-ui/react-scroll-area';

const ResearchComponent = ({ team }: { team: any }) => {
    const { t } = useTranslation('common');
    const [query, setQuery] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [overallQuery, setOverallQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [isTooltipTwoOpen, setIsTooltipTwoOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    // const { data: session, status } = useSession(); // Hook from next-auth to get the session
    // const [userId, setUserId] = useState<string | null>(null);
    const [pastQueries, setPastQueries] = useState<any[]>([]);
    const [similarQueries, setSimilarQueries] = useState<any[]>([]);
    const [isResearchLoading, setIsResearchLoading] = useState(false);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metrics, setMetrics] = useState<{
        electricityUsage: number;
        waterConsumption: number;
        totalTokens: number;
        processingTime: number;
        totalCost: number;
        recycledDataPercentage: number;
    } | null>(null);

    const loadingStates = [
        {
            text: "Your request is queued...",
        },
        {
            text: "Connecting to AIVO's document store...",
        },
        {
            text: "Retrieving your documents...",
        },
        {
            text: "Setting up AI research environment...",
        },
        {
            text: "Warming up the LLMs, Embeddings, etc...",
        },
        {
            text: "Preparing document analysis tools...",
        },
        {
            text: "Almost ready...",
        }
    ];

    const researchLoadingStates = [
        {
            text: "Initializing AI Research process...",
        },
        {
            text: "Digesting your documents...",
        },
        {
            text: "Analyzing content with advanced LLMs...",
        },
        {
            text: "Generating comprehensive researchinsights...",
        },
        {
            text: "Compiling individual research results...",
        },
        {
            text: "Off to AI for overall research results...",
        },
        {
            text: "Finalizing the research results...",
        },
        {
            text: "Just getting done...",
        }
    ];

    useEffect(() => {
        if (isDrawerOpen) {
            document.body.classList.add('drawer-open', 'drawer-background-black');
            // Calculate metrics when the drawer is opened
            // Use the defaultMetrics as a fallback
            const calculatedMetrics = calculateMetrics(selectedDocuments, query, overallQuery, pastQueries, team.id) || metrics;
            setMetrics(calculatedMetrics);
        } else {
            document.body.classList.remove('drawer-open', 'drawer-background-black');
        }

        // Cleanup in case the component unmounts while the drawer is open
        return () => {
            document.body.classList.remove('drawer-open', 'drawer-background-black');
        };
    }, [isDrawerOpen]);


    useEffect(() => {
        const fetchPastQueries = async () => {
            try {
                const response = await fetch(`/api/ai-research/past-queries?teamId=${team.id}`);
                if (!response.ok) {
                    //toast.error("Our systems are overworked... Unable to get past queries");
                    console.log("Failed to fetch past queries");
                    throw Error;
                }
                const data = await response.json();
                setPastQueries(data);
            } catch (error) {
                console.error('Error fetching past queries:', error);
            }
        };

        fetchPastQueries();
    }, [team.id]);

    useEffect(() => {
        const loadDocuments = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/documents?teamId=${team.id}&status=Ready`);
                if (!response.ok) {
                    toast.error(`Failed to fetch documents`);
                    throw Error('Failed to fetch documents');
                }
                const data = await response.json();
                setDocuments(data);
            } catch (err) {
                setError(String(err));
            } finally {
                setIsLoading(false);
            }
        };
        loadDocuments();
    }, [team.id]);

    useEffect(() => {
        const fetchSimilarQueries = async () => {
            if (query.length < 3) return; // Fetch only if query is longer than 3 characters
            try {
                const response = await fetch(`/api/ai-research/past-queries?teamId=${team.id}&query=${query}`);
                if (!response.ok) {
                    console.log("Failed to fetch similar queries");
                    return;
                }
                const data = await response.json();
                setSimilarQueries(data);
            } catch (error) {
                console.log('Error fetching similar queries:', error);
            }
        };

        fetchSimilarQueries();
    }, [query, team.id]);

    // useEffect(() => {
    //     const fetchUserId = async () => {
    //       if (session && status === 'authenticated') {
    //         try {
    //           const user = await getUserBySession(session);
    //           if (user) {
    //             setUserId(user.id); // Set the userId in state
    //           }
    //         } catch (error) {
    //           console.error('Error fetching user:', error);
    //         }
    //       }
    //     };

    //     fetchUserId();
    //   }, [session, status]);


    const truncateFileName = (name: string, maxLength: number = 25) => {
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
    };

    const handleDocumentSelect = (documentId: string) => {
        setSelectedDocuments((prevSelected) => {
            if (prevSelected.includes(documentId)) {
                return prevSelected.filter((id) => id !== documentId);
            } else {
                return [...prevSelected, documentId];
            }
        });
    };

    const handleSelectAllDocuments = () => {
        if (selectedDocuments.length === documents.length) {
            setSelectedDocuments([]);
        } else {
            setSelectedDocuments(documents.map((doc) => doc.id));
        }
    };

    const handleSelectInModal = (selectedInModal: string[]) => {
        setSelectedDocuments(selectedInModal);
        document.getElementById('document_modal')?.close();
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'application/pdf': return <BsFiletypePdf className="text-4xl" />;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return <BsFiletypeDoc className="text-4xl" />;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return <BsFiletypePpt className="text-4xl" />;
            case 'text/csv': return <BsFiletypeCsv className="text-4xl" />;
            case 'text/plain': return <BsFiletypeTxt className="text-4xl" />;
            default: return <BsFileEarmarkText className="text-4xl" />;
        }
    };

    const renderTooltipContent = (text: string) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    const handlePastQuerySelect = async (selectedQuery: string) => {
        const pastQuery = pastQueries.find(query => query.userSearchQuery === selectedQuery);
        if (pastQuery) {
            setQuery(pastQuery.userSearchQuery);
            setOverallQuery(pastQuery.overallQuery);
            setSelectedDocuments(pastQuery.documentIds || []);

            // Optionally, you can also fetch detailed info if needed
        }
    };

    const handleSubmit = async () => {
        if (!query || selectedDocuments.length === 0) return;

        setMetricsLoading(true);
        try {
            const calculatedMetrics = await calculateMetrics(
                selectedDocuments,
                query,
                overallQuery,
                similarQueries,
                team.id
            );
            setMetrics(calculatedMetrics);
            setIsDrawerOpen(true);
        } catch (error) {
            console.error('Error calculating metrics:', error);
            setError(String(error));
        } finally {
            setMetricsLoading(false);
        }
    };

    // Function to calculate various metrics for AI research
    const calculateMetrics = async (documentIds: string[], individualQuery: string, overallQuery: string, pastQueries: any[], teamId: string) => {
        const tokensPerWord = 1.5;
        const kWhPer150Tokens = 0.14;
        const waterPer150Tokens = 0.5;
        const costPerMillionInputTokens = 2.50;
        const costPerMillionOutputTokens = 10.00;

        let totalTokens = 0;

        try {
            const response = await fetch(`/api/documents/chunks?documentIds=${documentIds.join(',')}`);
            if (!response.ok) {
                console.error('Failed to fetch document chunks data');
                throw new Error('Failed to fetch document chunks');
            }
            const chunks = await response.json();

            chunks.forEach(chunk => {
                //console.log('Chunk metadata:', chunk.metadata); // Log the metadata structure

                // Iterate over the metadata array directly
                if (Array.isArray(chunk.metadata)) {
                    const wordCountEntry = chunk.metadata.find(meta => meta.key === 'wordCount');
                    const wordCount = wordCountEntry ? parseInt(wordCountEntry.value, 10) : 0;
                    totalTokens += wordCount * tokensPerWord;
                } else {
                    console.warn('Chunk metadata is not an array', chunk.metadata);
                }
            });

            const overallTokens = overallQuery.split(/\s+/).length * tokensPerWord;
            totalTokens += overallTokens;

            const electricityUsage = (totalTokens / 150) * kWhPer150Tokens;
            const waterConsumption = (totalTokens / 150) * waterPer150Tokens;
            const inputCost = (totalTokens / 1_000_000) * costPerMillionInputTokens;
            const outputCost = (overallTokens / 1_000_000) * costPerMillionOutputTokens;
            const totalCost = inputCost + outputCost;
            const processingTime = totalTokens / 1000;

            const previouslySearchedDocuments = pastQueries.reduce((acc, query) => {
                if (query.userSearchQuery === individualQuery && query.overallQuery === overallQuery) {
                    acc.push(...query.documentIds);
                }
                return acc;
            }, []);

            const uniquePreviouslySearchedDocuments = [...new Set(previouslySearchedDocuments)];
            const recycledDataCount = documentIds.filter(docId => uniquePreviouslySearchedDocuments.includes(docId)).length;
            const recycledDataPercentage = (recycledDataCount / documentIds.length) * 100;

            return {
                electricityUsage,
                waterConsumption,
                totalTokens,
                processingTime,
                totalCost,
                recycledDataPercentage
            };
        } catch (error) {
            console.error('Error calculating metrics:', error);
            throw error;
        }
    };

    const proceedWithResearch = async () => {
        setIsDrawerOpen(false);
        setIsResearchLoading(true);

        try {
            const response = await fetch('/api/ai-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: "",
                    teamId: team.id,
                    documentIds: selectedDocuments,
                    userSearchQuery: query,
                    overallQuery: overallQuery || "The following text is a summary of different outputs. Please provide an inclusive extended summary of the following answers:",
                    similarityScore: 0.8,
                    sequentialQuery: true,
                    enhancedSearch: false,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(t('failed-to-submit-research-request'));
                throw new Error('Failed to submit research request');
            }

            if (data.redirectTo) {
                window.location.href = data.redirectTo;
            } else {
                toast.success(t('research-request-submitted-successfully'));
                window.location.href = `/teams/${team.slug}/activity-log`;
            }
        } catch (err) {
            setError(String(err));
            setIsResearchLoading(false);
        }
    };

    const visibleDocuments = documents.slice(0, 5);

    return (

        <div className="flex flex-col pb-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
                {t('AI Research')}
            </h2>
            <div className="p-4">
                <div className="card w-full border-rounded bg-neutral-100 mb-4 mt-4">
                    <Card.Body>
                        <h2 className="text-xl font-semibold">{t('research-step-one')}
                            <div className="relative inline-block">
                                <span
                                    className="cursor-pointer text-xs bg-base-200 px-2 py-1 rounded-full z-1000 ml-2"
                                    onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                                >
                                    ?
                                </span>
                                {isTooltipOpen && (
                                    <div className="absolute bottom-0 w-[500px] text-xs left-full mb-2 ml-2 p-2 bg-white border rounded shadow-lg z-50">
                                        {renderTooltipContent(t('step-one-tooltip'))}
                                    </div>
                                )}
                            </div>
                        </h2>
                        <div>
                            <Command className="rounded-lg border shadow-md w-full bg-white">
                                <div className="flex items-center border-b px-3">
                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('Search...')}
                                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <CommandList className="max-h-[200px]">
                                    <CommandEmpty>{t('Type to discover similar suggestions...')}</CommandEmpty>
                                    {similarQueries.length > 0 && (
                                        <CommandGroup
                                            heading={t('Search Suggestions')}
                                            className="overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:p-[1%]"
                                        >
                                            {similarQueries.slice(0, 5).map((query, index) => (
                                                <CommandItem
                                                    key={index}
                                                    value={query.userSearchQuery}
                                                    onSelect={(value) => handlePastQuerySelect(value)}
                                                    className="cursor-pointer mb-[1%] hover:bg-slate-300"
                                                >
                                                    <History className="mr-2 h-4 w-4 shrink-0" strokeWidth={1} />
                                                    <span>{query.userSearchQuery}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                            {/* <label className="input input-bordered flex items-center gap-2 rounded-full">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-4 w-4 opacity-70">
                                    <path
                                        fillRule="evenodd"
                                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                        clipRule="evenodd" />
                                </svg>
                                <input name="search" type="text" className="grow" placeholder="Search..." onChange={(e) => setQuery(e.target.value)} />
                            </label>
                            <select onChange={(e) => handlePastQuerySelect(e.target.value)} className="select select-bordered w-full mt-2">
                                <option value="">{t('Select a past query')}</option>
                                {similarQueries.map((query, index) => (
                                    <option key={index} value={query.userSearchQuery}>
                                        {query.userSearchQuery}
                                    </option>
                                ))}
                            </select> */}
                        </div>
                    </Card.Body>
                </div>
                <div className="card w-full border-rounded bg-neutral-100 mb-4 mt-4">
                    <Card.Body>
                        <h2 className="text-xl font-semibold">{t('research-step-two')}</h2>
                        <ScrollArea className="w-full max-w-full whitespace-nowrap rounded-md border bg-white ScrollAreaRoot">
                            <div className="flex max-w-full space-x-4 p-4">
                                {visibleDocuments.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => handleDocumentSelect(doc.id)}
                                        className={`border rounded p-2 flex items-center gap-2 ${selectedDocuments.includes(doc.id) ? 'bg-gray-200' : 'border-gray-300'}`}
                                    >
                                        {getFileIcon(doc.type)}
                                        <span className="block text-center text-xs">{truncateFileName(doc.title)}</span>
                                    </button>
                                ))}
                                <button
                                    className="border rounded p-2 flex items-center gap-2"
                                    onClick={() => document.getElementById('document_modal')?.showModal()}
                                >
                                    <IoOpenOutline className="text-4xl" />
                                    <span className="block text-center text-xs font-bold">{t('view-more')}</span>
                                </button>
                            </div>
                            <ScrollBar orientation="horizontal" className="ScrollAreaScrollbar ScrollAreaScrollbar:hover" />
                            <ScrollAreaCorner className="ScrollAreaCorner" />

                        </ScrollArea>
                        <div className="flex justify-center">
                            <Button className="btn btn-secondary btn-sm btn-block rounded-full" onClick={handleSelectAllDocuments}>
                                {selectedDocuments.length === documents.length ? t('deselect-all-documents') : t('search-all-documents')}
                            </Button>
                        </div>
                    </Card.Body>
                </div>
                <div className="collapse collapse-arrow bg-neutral-100 mb-2 mt-4 overflow-visible">
                    <input type="checkbox" />
                    <div className="collapse-title badge-neutral-100 text-sm font-medium">{t('Optional Settings')}</div>
                    <div className="collapse-content">
                        <h2 className="text-xl font-semibold mb-2 mt-4">{t('research-step-three')}
                            <div className="relative inline-block">
                                <span
                                    className="cursor-pointer text-xs bg-base-200 px-2 py-1 rounded-full ml-2"
                                    onClick={() => setIsTooltipTwoOpen(!isTooltipTwoOpen)}
                                >
                                    ?
                                </span>
                                {isTooltipTwoOpen && (
                                    <div className="absolute w-[500px] bottom-0 text-xs left-full mb-2 ml-2 p-2 bg-white border rounded shadow-lg z-50">
                                        {renderTooltipContent(t('step-three-tooltip'))}
                                    </div>
                                )}
                            </div>
                        </h2>
                        <label className="input input-bordered flex items-center gap-2 rounded-full">
                            <input
                                name="overallQuery"
                                type="text"
                                className="grow"
                                placeholder="Write a summary based on the following findings"
                                value={overallQuery}
                                onChange={(e) => setOverallQuery(e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-8">
                    <Drawer open={isDrawerOpen} onOpenChange={(open) => setIsDrawerOpen(open)}>
                        <DrawerTrigger asChild>
                            <Button
                                color="neutral"
                                className="transition ease-in-out bg-neutral-500 hover:-translate-y-1 hover:scale-110 hover:bg-neutral-950 duration-300 rounded-full shadow-xl border-none"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={!query || selectedDocuments.length === 0}
                            >
                                {t('research')}
                            </Button>
                        </DrawerTrigger>
                        <DrawerOverlay className="fixed inset-0 z-50 bg-black/60">
                            <DrawerContent className="bg-white bottom-0 left-0 right-0 rounded-tr-2xl rounded-tl-2xl">
                                <div className="mx-auto w-full max-w-sm">
                                    <DrawerHeader>
                                        <DrawerTitle className="text-xl font-bold">{t('Research Analysis')}</DrawerTitle>
                                        <DrawerDescription className="text-muted-foreground">
                                            {t('Review the estimated resource consumption and environmental impact of your research query 🍃')}
                                        </DrawerDescription>
                                    </DrawerHeader>

                                    {metrics && (
                                        <div className="p-6">
                                            <div className="space-y-2">
                                                {/* Documents Selected */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="h-4 w-4 text-slate-500" />
                                                                    <span className="text-sm font-medium">{t('Documents Selected')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <NumberTicker
                                                                            value={selectedDocuments?.length || 0}
                                                                            className="text-sm font-bold"
                                                                            decimalPlaces={0}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Document Selection')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('The total number of documents selected for analysis. Each document will be processed to generate comprehensive research insights.')}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Electricity Usage */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                                    <span className="text-sm font-medium">{t('Electricity Usage')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <>
                                                                            <NumberTicker
                                                                                value={metrics?.electricityUsage || 0}
                                                                                className="text-sm font-bold"
                                                                                decimalPlaces={2}
                                                                            />
                                                                            <span className="text-xs text-slate-500">kWh</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Electricity Consumption')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('This represents the estimated amount of electricity consumed during the processing of your documents. We use this metric to track and optimize our environmental impact.')}
                                                                </p>
                                                                <a
                                                                    href="https://www.washingtonpost.com/technology/2024/09/18/energy-ai-use-electricity-water-data-centers/"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 underline mt-2"
                                                                >
                                                                    {t('Read More')}
                                                                    <ExternalLink size={12} />
                                                                </a>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Water Consumption */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <Droplet className="h-4 w-4 text-blue-500" />
                                                                    <span className="text-sm font-medium">{t('Water Consumption')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <>
                                                                            <NumberTicker
                                                                                value={metrics?.waterConsumption || 0}
                                                                                className="text-sm font-bold"
                                                                                decimalPlaces={2}
                                                                            />
                                                                            <span className="text-xs text-slate-500">L</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Water Usage')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('The estimated water consumption for cooling the servers during document processing. This helps us monitor our water footprint.')}
                                                                </p>
                                                                <a
                                                                    href="https://www.washingtonpost.com/technology/2024/09/18/energy-ai-use-electricity-water-data-centers/"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 underline mt-2"
                                                                >
                                                                    {t('Read More')}
                                                                    <ExternalLink size={12} />
                                                                </a>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Total Tokens */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <Hash className="h-4 w-4 text-purple-500" />
                                                                    <span className="text-sm font-medium">{t('Total Tokens')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <NumberTicker
                                                                            value={metrics?.totalTokens || 0}
                                                                            className="text-sm font-bold"
                                                                            decimalPlaces={0}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Token Processing')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('The total number of tokens processed across all selected documents. Tokens are the basic units of text that the AI model processes.')}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Processing Time */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 text-slate-500" />
                                                                    <span className="text-sm font-medium">{t('Processing Time')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <>
                                                                            <NumberTicker
                                                                                value={metrics?.processingTime || 0}
                                                                                className="text-sm font-bold"
                                                                                decimalPlaces={2}
                                                                            />
                                                                            <span className="text-xs text-slate-500">s</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Processing Time')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('Estimated time to process all documents')}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Total Cost */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="h-4 w-4 text-green-500" />
                                                                    <span className="text-sm font-medium">{t('LLM Cost')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <>
                                                                            <span className="text-xs text-slate-500">$</span>
                                                                            <NumberTicker
                                                                                value={metrics?.totalCost || 0}
                                                                                className="text-sm font-bold"
                                                                                decimalPlaces={2}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('LLM Cost')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('Estimated cost for processing')}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Recycled Data */}
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <Recycle className="h-4 w-4 text-green-500" />
                                                                    <span className="text-sm font-medium">{t('Recycled Data')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {metricsLoading ? (
                                                                        <span className="loading loading-ring loading-sm text-slate-400"></span>
                                                                    ) : (
                                                                        <>
                                                                            <NumberTicker
                                                                                value={metrics?.recycledDataPercentage || 0}
                                                                                className="text-sm font-bold"
                                                                                decimalPlaces={2}
                                                                            />
                                                                            <span className="text-xs text-slate-500">%</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="flex gap-3 p-3 max-w-xs bg-slate-200" onPointerEnter={(e) => e.preventDefault()}>
                                                            <Info
                                                                className="mt-0.5 shrink-0 text-slate-400"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="space-y-1">
                                                                <p className="text-[13px] font-medium">
                                                                    {t('Recycled Data')}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('Percentage of previously processed data being reused')}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    )}

                                    <DrawerFooter>
                                        <Button
                                            color="neutral"
                                            onClick={proceedWithResearch}
                                            className="bg-slate-900 text-white hover:bg-slate-800"
                                        >
                                            {t('Proceed with Analysis')}
                                        </Button>
                                        <DrawerClose asChild>
                                            <Button variant="outline">{t('Cancel')}</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </div>
                            </DrawerContent>
                        </DrawerOverlay>
                    </Drawer>
                </div>

                {loading && (
                    <MultiStepLoader
                        loadingStates={loadingStates}
                        loading={loading}
                        duration={3000}
                        loop={true}
                    />
                )}

                {isResearchLoading && (
                    <MultiStepLoader
                        loadingStates={researchLoadingStates}
                        loading={isResearchLoading}
                        duration={2500}
                        loop={true}
                    />
                )}

                {error && <Error message={error} />}

                <dialog id="document_modal" className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box w-11/12 max-w-5xl">
                        <h3 className="font-bold text-lg">{t('select-documents')}</h3>
                        <SelectableDocumentTable
                            documents={documents}
                            selectedDocuments={selectedDocuments}
                            onSelect={handleDocumentSelect}
                        />
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => document.getElementById('document_modal')?.close()}>✕</button>
                        <div className="modal-action">
                            <button className="btn btn-sm" onClick={() => handleSelectInModal(selectedDocuments)}>{t('select')}</button>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
};

export default ResearchComponent;