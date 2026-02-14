'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { listReports, Report } from '../../lib/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from 'use-debounce';

export default function AdminDashboard() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Data State
    const [reports, setReports] = useState<Report[]>([]);
    const [nextToken, setNextToken] = useState<string | null>(null);


    // UI State
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadReports = useCallback(async (token: string | null = null, searchQuery: string = '') => {
        setLoading(true);
        try {
            const data = await listReports(10, token, searchQuery);
            setReports(data.items);
            setNextToken(data.nextToken);
            setError('');
        } catch (err: unknown) {
            console.error(err);
            setError('Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
        } else if (authStatus === 'authenticated') {
            fetchAuthSession().then(session => {
                const payload = session.tokens?.accessToken?.payload;
                const userGroups = (payload?.['cognito:groups'] || []) as string[];

                if (userGroups.includes('Admin') || userGroups.includes('Manager')) {
                    setIsAuthorized(true);
                    // Initial load happens in the search effect below
                } else {
                    router.push('/profile');
                }
            });
        }
    }, [authStatus, router]);

    // Search Effect - Reset pagination on search change
    useEffect(() => {
        if (isAuthorized) {
            loadReports(null, debouncedSearch);
        }
    }, [debouncedSearch, isAuthorized, loadReports]);



    // Let's use a simpler approach:
    // `currentStartToken`: The token used to fetch the current page.
    // `history`: Array of tokens used for previous pages.
    const [currentStartToken, setCurrentStartToken] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    const fetchPage = (token: string | null) => {
        loadReports(token, debouncedSearch);
        setCurrentStartToken(token);
    };

    const onNext = () => {
        if (nextToken) {
            setHistory(prev => [...prev, currentStartToken || 'HEAD']); // Use 'HEAD' for null to distinguish
            fetchPage(nextToken);
        }
    };

    const onPrev = () => {
        if (history.length === 0) return;
        const prevToken = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        fetchPage(prevToken === 'HEAD' ? null : prevToken);
    };


    if (authStatus !== 'authenticated' || !isAuthorized) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Checking authorization...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md border border-destructive/20 text-sm">
                    {error}
                </div>
            )}
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <h2 className="text-lg font-semibold">Reports ({reports.length} visible)</h2>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reports..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reports List</CardTitle>
                    <CardDescription>
                        {debouncedSearch ? `Searching for "${debouncedSearch}"` : "Most recent submissions"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No reports found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reports.map((report) => (
                                            <TableRow key={report.reportId}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(report.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    <div className="font-medium">{report.concernType}</div>
                                                    <div className="text-sm text-muted-foreground truncate">{report.description}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {report.emailLocation || (report.location ? `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}` : 'N/A')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/admin/reports/${report.reportId}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-4">
                    <Button
                        variant="outline"
                        onClick={onPrev}
                        disabled={history.length === 0 || loading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onNext}
                        disabled={!nextToken || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

