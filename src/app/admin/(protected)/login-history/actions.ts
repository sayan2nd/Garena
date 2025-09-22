'use server';

import { isAdminAuthenticated } from '@/app/actions';
import { User } from '@/lib/definitions';
import { connectToDatabase } from '@/lib/mongodb';
import { unstable_noStore as noStore } from 'next/cache';
import { revalidatePath } from 'next/cache';

export async function findUserForHistory(gamingId: string): Promise<{ success: boolean; message?: string; user?: User; }> {
    noStore();
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) return { success: false, message: 'Unauthorized' };
    if (!gamingId) return { success: false, message: 'Gaming ID is required.' };

    try {
        const db = await connectToDatabase();
        const user = await db.collection<User>('users').findOne({ gamingId });
        if (!user) {
            return { success: false, message: 'User not found.' };
        }
        return { success: true, user: JSON.parse(JSON.stringify(user)) };
    } catch (error) {
        return { success: false, message: 'An error occurred while searching for the user.' };
    }
}

export async function addHistoryEntry(gamingId: string, newHistoryId: string): Promise<{ success: boolean; message: string; updatedUser?: User }> {
    noStore();
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) return { success: false, message: 'Unauthorized' };

    try {
        const db = await connectToDatabase();
        const result = await db.collection<User>('users').findOneAndUpdate(
            { gamingId },
            { $push: { loginHistory: { gamingId: newHistoryId, timestamp: new Date() } } },
            { returnDocument: 'after' }
        );
        if (!result) {
            return { success: false, message: 'User not found.' };
        }
        revalidatePath('/admin/login-history');
        return { success: true, message: 'History entry added.', updatedUser: JSON.parse(JSON.stringify(result)) };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}


export async function editHistoryEntry(gamingId: string, oldHistoryId: string, newHistoryId: string): Promise<{ success: boolean; message: string; updatedUser?: User }> {
    noStore();
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) return { success: false, message: 'Unauthorized' };

    try {
        const db = await connectToDatabase();
        const result = await db.collection<User>('users').findOneAndUpdate(
            { gamingId, 'loginHistory.gamingId': oldHistoryId },
            { $set: { 'loginHistory.$.gamingId': newHistoryId } },
            { returnDocument: 'after' }
        );
        if (!result) {
            return { success: false, message: 'User or history entry not found.' };
        }
        revalidatePath('/admin/login-history');
        return { success: true, message: 'History entry updated.', updatedUser: JSON.parse(JSON.stringify(result)) };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}

export async function deleteHistoryEntry(gamingId: string, historyIdToDelete: string): Promise<{ success: boolean; message: string; updatedUser?: User }> {
    noStore();
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) return { success: false, message: 'Unauthorized' };
    try {
        const db = await connectToDatabase();
        const result = await db.collection<User>('users').findOneAndUpdate(
            { gamingId },
            { $pull: { loginHistory: { gamingId: historyIdToDelete } } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return { success: false, message: 'User not found.' };
        }

        revalidatePath('/admin/login-history');
        return { success: true, message: 'History entry deleted.', updatedUser: JSON.parse(JSON.stringify(result)) };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}
