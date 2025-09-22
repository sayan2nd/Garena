'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Trash2, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findUserForHistory, addHistoryEntry, editHistoryEntry, deleteHistoryEntry } from '../actions';
import type { User } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type HistoryItem = {
  gamingId: string;
  timestamp: Date;
};

const FormattedDate = ({ dateString }: { dateString: Date }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
};

export default function LoginHistoryManager() {
    const { toast } = useToast();
    const [isSearching, startSearchTransition] = useTransition();
    const [isSubmitting, startSubmitTransition] = useTransition();
    
    const [gamingIdToSearch, setGamingIdToSearch] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newHistoryId, setNewHistoryId] = useState('');
    
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<{ oldId: string, newId: string } | null>(null);

    const handleSearchUser = async () => {
        if (!gamingIdToSearch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a Gaming ID.' });
            return;
        }
        startSearchTransition(async () => {
            const result = await findUserForHistory(gamingIdToSearch);
            if (result.success && result.user) {
                setFoundUser(result.user);
                toast({ title: 'User Found', description: `Now managing history for ${result.user.gamingId}.` });
            } else {
                setFoundUser(null);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleAddEntry = async () => {
        if (!foundUser || !newHistoryId) return;
        startSubmitTransition(async () => {
            const result = await addHistoryEntry(foundUser.gamingId, newHistoryId);
            if (result.success && result.updatedUser) {
                setFoundUser(result.updatedUser);
                toast({ title: 'Success', description: 'History entry added.' });
                setIsAddDialogOpen(false);
                setNewHistoryId('');
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };
    
    const handleEditEntry = async () => {
        if (!foundUser || !editingEntry) return;
        startSubmitTransition(async () => {
            const result = await editHistoryEntry(foundUser.gamingId, editingEntry.oldId, editingEntry.newId);
             if (result.success && result.updatedUser) {
                setFoundUser(result.updatedUser);
                toast({ title: 'Success', description: 'History entry updated.' });
                setIsEditDialogOpen(false);
                setEditingEntry(null);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleDeleteEntry = (entryId: string) => {
        if (!foundUser) return;
        startSubmitTransition(async () => {
             const result = await deleteHistoryEntry(foundUser.gamingId, entryId);
             if (result.success && result.updatedUser) {
                setFoundUser(result.updatedUser);
                toast({ title: 'Success', description: 'History entry deleted.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Manage User Login History</CardTitle>
                    <CardDescription>Search for a user to view, add, edit, or delete their login history records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="gamingId">User's Gaming ID</Label>
                            <Input id="gamingId" value={gamingIdToSearch} onChange={(e) => setGamingIdToSearch(e.target.value)} placeholder="Enter Gaming ID"/>
                        </div>
                        <Button type="button" onClick={handleSearchUser} disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin"/> : <Search />}
                            Search User
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {foundUser && (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>History for: <span className="font-mono">{foundUser.gamingId}</span></CardTitle>
                            <CardDescription>
                                Found {foundUser.loginHistory?.length || 0} history records.
                            </CardDescription>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="mr-2"/> Add Entry
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New History Entry</DialogTitle>
                                <DialogDescription>Enter the Gaming ID to add to this user's history.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <Label htmlFor="new-history-id">Gaming ID</Label>
                                <Input id="new-history-id" value={newHistoryId} onChange={(e) => setNewHistoryId(e.target.value)}/>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                <Button onClick={handleAddEntry} disabled={isSubmitting || !newHistoryId}>
                                    {isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                                    Add
                                </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {(foundUser.loginHistory && foundUser.loginHistory.length > 0) ? (
                            <div className="space-y-2">
                                {foundUser.loginHistory.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <div>
                                            <p className="font-semibold font-mono">{item.gamingId}</p>
                                            <p className="text-xs text-muted-foreground"><FormattedDate dateString={item.timestamp} /></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Dialog open={isEditDialogOpen && editingEntry?.oldId === item.gamingId} onOpenChange={(open) => { if (!open) { setIsEditDialogOpen(false); setEditingEntry(null); } }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={() => { setIsEditDialogOpen(true); setEditingEntry({ oldId: item.gamingId, newId: item.gamingId }); }}>
                                                        <Edit />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit History Entry</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-2">
                                                        <Label htmlFor="edit-history-id">Gaming ID</Label>
                                                        <Input id="edit-history-id" value={editingEntry?.newId} onChange={(e) => setEditingEntry(prev => prev ? { ...prev, newId: e.target.value } : null)} />
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                                        <Button onClick={handleEditEntry} disabled={isSubmitting}>
                                                            {isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                                                            Save Changes
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon"><Trash2/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the history entry for <span className="font-mono">{item.gamingId}</span>.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteEntry(item.gamingId)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No login history for this user.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
