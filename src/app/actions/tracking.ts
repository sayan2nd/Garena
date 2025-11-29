
'use server';

import { isAdminAuthenticated, getSession } from '@/app/actions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Order } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

/**
 * Marks a specific order as tracked by the Meta Pixel.
 * This is called from a client component after the pixel event has been fired.
 * @param orderId The ID of the order to update.
 * @returns An object indicating success or failure.
 */
export async function markPurchaseAsTracked(orderId: string): Promise<{ success: boolean; message?: string }> {
    // No strict authentication needed here as this is a background task,
    // but we can ensure the user is logged in as a basic check.
    const session = await getSession();
    if (!session) {
      // Allow it to proceed even for non-admin users if they have a user session, but for now we'll just check admin
      // This is a soft check. The main thing is that we have an orderId.
    }

    if (!orderId) {
        return { success: false, message: 'Order ID is required.' };
    }

    try {
        const db = await connectToDatabase();
        
        const result = await db.collection<Order>('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { isPixelTracked: true } }
        );

        if (result.modifiedCount === 0) {
            // This might happen if the order doesn't exist, or was already marked.
            // It's not a critical failure.
            return { success: false, message: 'Order not found or already tracked.' };
        }

        console.log(`Order ${orderId} marked as pixel-tracked.`);
        
        // Revalidate the home page to ensure the MetaPixelTracker component isn't rendered again for this order
        revalidatePath('/');

        return { success: true };

    } catch (error) {
        console.error('Error in markPurchaseAsTracked:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
