'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { getAiLogs, deleteAiLog } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { type AiLog } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface LogListProps {
    initialLogs: AiLog[];
    initialHasMore: boolean;
    totalLogs: number;
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
}

export default function LogList({ initialLogs, initialHasMore, totalLogs }: LogListProps) {
    const [logs, setLogs] = useState<AiLog[]>(initialLogs);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();


    const search = searchParams.get('search') || '';

    useEffect(() => {
        setLogs(initialLogs);
        setHasMore(initialHasMore);
        setPage(1);
    }, [initialLogs, initialHasMore]);

    // Group logs by gamingId
    const conversations = useMemo(() => {
        return logs.reduce((acc, log) => {
            if (!acc[log.gamingId]) {
                acc[log.gamingId] = [];
            }
            acc[log.gamingId].push(log);
            return acc;
        }, {} as Record<string, AiLog[]>);
    }, [logs]);

    const handleLoadMore = async () => {
        startTransition(async () => {
            const nextPage = page + 1;
            const { logs: newLogs, hasMore: newHasMore } = await getAiLogs(nextPage, search);
            setLogs(prev => [...prev, ...newLogs]);
            setHasMore(newHasMore);
            setPage(nextPage);
        });
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const searchQuery = formData.get('search') as string;
        const params = new URLSearchParams(searchParams);
        params.set('search', searchQuery);
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };
    
    const handleDelete = async (logId: string) => {
        startTransition(async () => {
            const result = await deleteAiLog(logId);
            if (result.success) {
                setLogs(prev => prev.filter(log => log._id.toString() !== logId));
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                         <div className="flex items-center gap-2">
                           <CardTitle>AI Conversation Logs</CardTitle>
                           <Badge variant="secondary" className="text-sm">{totalLogs} Messages</Badge>
                        </div>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <Input name="search" placeholder="Search by Gaming ID..." defaultValue={search} className="w-56"/>
                            <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                        </form>
                    </div>
                     <CardDescription>View the conversations users are having with the FAQ chatbot.</CardDescription>
                </CardHeader>
                <CardContent>
                    {Object.keys(conversations).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No AI logs to display.</p>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {Object.entries(conversations).map(([gamingId, messages]) => (
                               <Card key={gamingId} className="overflow-hidden">
                                 <AccordionItem value={gamingId} className="border-b-0">
                                    <AccordionTrigger className="p-4 bg-muted/50 hover:no-underline">
                                       <div className="flex justify-between items-center w-full">
                                            <div >
                                                <h3 className="font-mono font-semibold text-left">{gamingId}</h3>
                                                <p className="text-xs text-muted-foreground text-left">{messages.length} messages</p>
                                            </div>
                                       </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4">
                                        <div className="space-y-4">
                                            {messages.map(log => (
                                                <div key={log._id.toString()}>
                                                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                                        <p className="font-semibold text-blue-800">User:</p>
                                                        <p>{log.question}</p>
                                                        <p className="text-xs text-blue-600 mt-1"><FormattedDate dateString={log.createdAt as unknown as string} /></p>
                                                    </div>
                                                    <div className="p-3 mt-2 rounded-lg bg-gray-50 border">
                                                        <p className="font-semibold text-gray-800">Assistant:</p>
                                                        <p>{log.answer}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                               </Card>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {hasMore && (
                <div className="text-center">
                    <Button onClick={handleLoadMore} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
}
