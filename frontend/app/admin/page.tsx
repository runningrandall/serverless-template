'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listItems, createItem, deleteItem, Item } from '../../lib/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Loader2 } from "lucide-react"

export default function AdminDashboard() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
        } else if (authStatus === 'authenticated') {
            fetchAuthSession().then(session => {
                const payload = session.tokens?.accessToken?.payload;
                const userGroups = (payload?.['cognito:groups'] || []) as string[];

                if (userGroups.includes('Admin') || userGroups.includes('Manager')) {
                    setIsAuthorized(true);
                    loadItems();
                } else {
                    router.push('/profile'); // Not authorized
                }
            });
        }
    }, [authStatus, router]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await listItems();
            setItems(data);
            setError('');
        } catch (err: unknown) {
            console.error(err);
            setError('Failed to load items. You might not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setCreating(true);
        try {
            await createItem(newItemName, 'Created via Admin Dashboard');
            setNewItemName('');
            await loadItems();
        } catch {
            setError('Failed to create item');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await deleteItem(itemId);
            await loadItems();
        } catch (err: unknown) {
            console.error(err);
            setError('Failed to display error');
        }
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

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Item</CardTitle>
                        <CardDescription>Add a new item to the inventory.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="flex gap-2">
                            <Input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Item Name"
                                className="flex-1"
                            />
                            <Button type="submit" disabled={creating || !newItemName.trim()}>
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Stats</CardTitle>
                        <CardDescription>Overview of system metrics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{items.length}</div>
                        <p className="text-xs text-muted-foreground">Total Items in Database</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Item Management</CardTitle>
                    <CardDescription>View and manage existing items in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No items found. Create one above!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.pk + item.sk}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{item.itemId}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.itemId)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
