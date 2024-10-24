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

const ResearchComponent = ({ team }: { team: any }) => {
    const { t } = useTranslation('common');
    const [query, setQuery] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [overallQuery, setOverallQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(true);
    // const { data: session, status } = useSession(); // Hook from next-auth to get the session
    // const [userId, setUserId] = useState<string | null>(null);

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

    const handleSubmit = async () => {
        // if (!userId) {
        //     toast.error('User ID not found');
        //     return;
        // }

        if (!query || selectedDocuments.length === 0) {
            toast.error('Please enter a query and select at least one document');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/ai-research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: "",
                    teamId: team.id,
                    documentIds: selectedDocuments,
                    userSearchQuery: query,
                    overallQuery: overallQuery || 'Create a summary based on the following findings:',
                    similarityScore: 0.8, 
                    sequentialQuery: true,
                    enhancedSearch: false,
                }),
            });

            if (!response.ok) {
                toast.error(`Failed to submit research request`);
                throw new Error('Failed to submit research request');
            }

            toast.success(`Research request submitted successfully`);

            // Redirect to activity log after successful submission
            window.location.href = `/teams/${team.slug}/activity-log`;
            
        } catch (err) {
            setError(String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const visibleDocuments = documents.slice(0, 5);

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">{t('research-step-one')}</h2>
            <div className="mb-8">
                <label className="input input-bordered flex items-center gap-2">
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
            </div>
            <h2 className="text-xl font-semibold mb-4">{t('research-step-two')}</h2>
            <Card>
                <Card.Body>
                    <div className="flex gap-2 overflow-x-auto pb-4">
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
                    <div className="flex justify-center">
                        <Button className="btn btn-secondary btn-sm btn-block" onClick={handleSelectAllDocuments}>
                            {selectedDocuments.length === documents.length ? t('deselect-all-documents') : t('search-all-documents')}
                        </Button>
                    </div>
                </Card.Body>
            </Card>
            <h2 className="text-xl font-semibold mb-4">{t('research-step-three')}</h2>
               <div className="mb-8">
                   <button
                       className="btn btn-secondary"
                       onClick={() => setIsCollapsed(!isCollapsed)}
                   >
                       {isCollapsed ? t('expand') : t('collapse')}
                   </button>
                   {!isCollapsed && (
                       <div className="mt-4">
                           <label className="input input-bordered flex items-center gap-2">
                               <input
                                   name="overallQuery"
                                   type="text"
                                   className="grow"
                                   placeholder="Create a summary based on the following findings:"
                                   value={overallQuery}
                                   onChange={(e) => setOverallQuery(e.target.value)}
                               />
                           </label>
                       </div>
                   )}
               </div>


            <div className="mt-8">
                <Button color="neutral" fullWidth onClick={handleSubmit} disabled={!query || selectedDocuments.length === 0}>
                    {t('research')}
                </Button>
            </div>
            
            {loading && <Loading />}
            {error && <Error message={error} />}

            <dialog id="document_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box w-11/12 max-w-5xl">
                    <h3 className="font-bold text-lg">{t('select-documents')}</h3>
                    <SelectableDocumentTable
                        documents={documents}
                        selectedDocuments={selectedDocuments}
                        onSelect={handleDocumentSelect}
                    />
                    <div className="modal-action">
                        <button className="btn btn-sm" onClick={() => handleSelectInModal(selectedDocuments)}>{t('select')}</button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default ResearchComponent;
