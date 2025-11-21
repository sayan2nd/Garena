'use server';

import { isAdminAuthenticated, unbanUser } from '@/app/actions';
import { User } from '@/lib/definitions';
import { connectToDatabase } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

const PAGE_SIZE = 10;

export async function getBannedUsers(search: string, page: number, sort: string) {
    noStore();
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        return { users: [], hasMore: false };
    }

    let query: any = { isBanned: true };
    if (search) {
        query.gamingId = { $regex: search, $options: 'i' };
    }

    try {
        const db = await connectToDatabase();
        const skip = (page - 1) * PAGE_SIZE;

        const usersFromDb = await db.collection<User>('users')
            .find(query)
            .sort({ createdAt: sort === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .toArray();

        const totalUsers = await db.collection('users').countDocuments(query);
        const hasMore = skip + usersFromDb.length < totalUsers;

        const users = JSON.parse(JSON.stringify(usersFromDb));

        return { users, hasMore };
    } catch (error) {
        console.error("Error fetching banned users:", error);
        return { users: [], hasMore: false };
    }
}

export async function handleUnbanUser(userId: string): Promise<{ success: boolean; message: string }> {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        return { success: false, message: 'Unauthorized' };
    }

    const result = await unbanUser(userId);
    if(result.success) {
        revalidatePath('/admin/banned-users');
        revalidatePath('/admin/users');
    }
    return result;
}
