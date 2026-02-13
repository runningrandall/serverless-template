'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, User, Mail, Phone, AlertTriangle } from "lucide-react";

interface Report {
    reportId: string;
    createdAt: string;
    name: string;
    email: string;
    phone: string;
    concernType: string;
    description: string;
    locationDescription: string;
    dateObserved: string;
    timeObserved: string;
    location: {
        lat: number;
        lng: number;
    };
    imageKeys: string[];
    imageUrls?: string[]; // Presigned URLs
    status: string;
}

function ReportDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const fetchReport = useCallback(async (reportId: string) => {
        try {
            const res = await fetch(`${API_URL}/reports/${reportId}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Report not found');
                throw new Error('Failed to fetch report');
            }
            const data = await res.json();
            setReport(data);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error loading report');
            }
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        if (!id) return;

        if (authStatus === 'unauthenticated') {
            router.push('/login');
        } else if (authStatus === 'authenticated') {
            fetchAuthSession().then(session => {
                const payload = session.tokens?.accessToken?.payload;
                const userGroups = (payload?.['cognito:groups'] || []) as string[];

                if (userGroups.includes('Admin') || userGroups.includes('Manager')) {
                    setIsAuthorized(true);
                    fetchReport(id);
                } else {
                    router.push('/profile'); // Not authorized
                }
            });
        }
    }, [authStatus, router, id, fetchReport]);

    if (!id) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (authStatus !== 'authenticated' || !isAuthorized) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Checking authorization...</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading report...</span>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center text-destructive">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            <p>{error || 'Report not found'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => router.push('/admin')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="text-sm text-muted-foreground">
                    Report ID: <span className="font-mono">{report.reportId}</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-primary">{report.concernType}</CardTitle>
                                    <CardDescription>Created on {new Date(report.createdAt).toLocaleString()}</CardDescription>
                                </div>
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase">
                                    {report.status}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                                <p className="whitespace-pre-wrap">{report.description || 'No description provided.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" /> Date Observed
                                    </h3>
                                    <p>{report.dateObserved || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" /> Time Observed
                                    </h3>
                                    <p>{report.timeObserved || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" /> Location
                                </h3>
                                <p className="text-sm mb-2">{report.locationDescription}</p>
                                {GOOGLE_MAPS_API_KEY && (
                                    <div className="w-full h-48 bg-muted rounded-md overflow-hidden relative">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            allowFullScreen
                                            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${report.location.lat},${report.location.lng}`}
                                        ></iframe>
                                    </div>
                                )}
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Lat: {report.location.lat}, Lng: {report.location.lng}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {report.imageUrls && report.imageUrls.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.imageUrls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={url}
                                                alt={`Report image ${idx + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No images attached.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Reporter Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                                    <User className="h-3 w-3 mr-2" /> Name
                                </div>
                                <p>{report.name}</p>
                            </div>
                            <div>
                                <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                                    <Mail className="h-3 w-3 mr-2" /> Email
                                </div>
                                <p className="break-all">{report.email || 'N/A'}</p>
                            </div>
                            <div>
                                <div className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                                    <Phone className="h-3 w-3 mr-2" /> Phone
                                </div>
                                <p>{report.phone || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ReportDetailsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ReportDetailsContent />
        </Suspense>
    );
}
