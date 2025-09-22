'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { getOrdersForUser, getUserProductControls } from '@/app/actions';
import type { Product, User, Order, UserProductControl } from '@/lib/definitions';
import { ObjectId } from 'mongodb';

/**
 * Checks if a user is eligible to purchase a specific product at the current moment.
 * This re-validates all purchase rules on the server side.
 * @param userId - The ID of the user attempting the purchase.
 * @param productId - The ID of the product being purchased.
 * @returns An object indicating eligibility and a message.
 */
export async function checkPurchaseEligibility(
  userId: string,
  productId: string
): Promise<{ eligible: boolean; message: string }> {
  try {
    const db = await connectToDatabase();
    
    // 1. Fetch all necessary data
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(userId) });
    const product = await db.collection<Product>('products').findOne({ _id: new ObjectId(productId) });
    
    if (!user || !product) {
      return { eligible: false, message: 'User or product not found.' };
    }

    const orders = await getOrdersForUser();
    const controls = await getUserProductControls(user.gamingId);
    const control = controls.find(c => c.productId === productId);

    // 2. Perform validation checks (mirroring frontend logic)

    const isExpired = product.endDate && new Date(product.endDate) < new Date();
    if (isExpired && !product.isAvailable) {
       return { eligible: false, message: 'This item has expired.' };
    }
    
    if (!product.isAvailable) {
      return { eligible: false, message: 'This item is currently unavailable.' };
    }

    if (control?.type === 'block') {
      return { eligible: false, message: control.blockReason || 'You are restricted from purchasing this item.' };
    }

    const nonFailedOrders = orders.filter(o => o.status !== 'Failed' && o.productId === productId);
    
    if (control?.type === 'limitPurchase' && control.limitCount && nonFailedOrders.length >= control.limitCount) {
        return { eligible: false, message: 'You have reached your purchase limit for this item.' };
    }
    
    if (product.oneTimeBuy) {
        const allowance = control?.type === 'allowPurchase' ? (control.allowanceCount || 0) : 0;
        const totalAllowed = 1 + allowance;
        if (nonFailedOrders.length >= totalAllowed) {
            return { eligible: false, message: 'This is a one-time purchase item that you have already bought.' };
        }
    }

    // 3. If all checks pass, the user is eligible
    return { eligible: true, message: 'User is eligible.' };

  } catch (error) {
    console.error('Error checking purchase eligibility:', error);
    return { eligible: false, message: 'An unexpected error occurred. Please try again.' };
  }
}
