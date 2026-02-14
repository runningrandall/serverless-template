'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAuthSession, fetchUserAttributes, updatePassword } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Lock, User, LogOut } from "lucide-react"

export default function Profile() {
    const { authStatus, signOut } = useAuthenticator((context) => [context.authStatus]);
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [groups, setGroups] = useState<string[]>([]);
    const [username, setUsername] = useState<string>('');

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
        } else if (authStatus === 'authenticated') {
            fetchAuthSession().then(session => {
                const payload = session.tokens?.accessToken?.payload;
                const userGroups = (payload?.['cognito:groups'] || []) as string[];
                setGroups(Array.isArray(userGroups) ? userGroups : [userGroups]);
                setUsername(payload?.username as string || '');
            });

            fetchUserAttributes().then(attrs => {
                setEmail(attrs.email || '');
            }).catch(err => console.error(err));
        }
    }, [authStatus, router]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: "New passwords do not match", type: 'error' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ text: "Password must be at least 8 characters", type: 'error' });
            return;
        }

        setPasswordLoading(true);
        try {
            await updatePassword({ oldPassword, newPassword });
            setPasswordMessage({ text: "Password updated successfully!", type: 'success' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Failed to update password";
            setPasswordMessage({ text: errorMessage, type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (authStatus !== 'authenticated') {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Account Details
                    </CardTitle>
                    <CardDescription>Manage your account information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Username</Label>
                            <div className="font-medium bg-muted p-2 rounded-md">{username}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Email</Label>
                            <div className="font-medium bg-muted p-2 rounded-md">{email}</div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-muted-foreground">Roles</Label>
                            <div className="flex gap-2 mt-1">
                                {groups.length > 0 ? groups.map(g => (
                                    <span key={g} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                                        {g}
                                    </span>
                                )) : <span className="text-muted-foreground text-sm italic">No roles assigned</span>}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {passwordMessage && (
                            <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/15 text-destructive'}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Current Password</Label>
                            <Input
                                id="oldPassword"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={passwordLoading}>
                            {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
