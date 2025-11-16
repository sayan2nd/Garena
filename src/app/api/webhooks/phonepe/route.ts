
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { type Product, type User, type Order, type LegacyUser, type Notification } from '@/lib/definitions';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { sendPushNotification } from '@/lib/push-notifications';
import { setSmartVisualId } from '@/lib/auto-visual-id';
import { createHash } from 'crypto';

// This is now the single source of truth for creating orders.
// It is idempotent and handles both success and failure cases reliably.
export async function POST(req: NextRequest) {
    console.log("PhonePe webhook received.");

    // --- 1. Authorization ---
    const webhookUser = process.env.PHONEPE_WEBHOOK_USER;
    const webhookPass = process.env.PHONEPE_WEBHOOK_PASS;
    const authHeader = req.headers.get('authorization');

    if (!webhookUser || !webhookPass) {
        console.error('Webhook user/pass not configured in environment variables.');
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const expectedAuth = createHash('sha256').update(`${webhookUser}:${webhookPass}`).digest('hex');

    if (authHeader !== expectedAuth) {
        console.warn('Webhook received with invalid authorization.');
        return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    
    try {
        const notification = await req.json();
        console.log("Decoded webhook payload:", JSON.stringify(notification, null, 2));

        const { merchantOrderId, amount, state } = notification.payload;
        const finalAmount = amount / 100;
        const db = await connectToDatabase();
        
        // --- 2. IDEMPOTENCY CHECK ---
        const existingOrder = await db.collection<Order>('orders').findOne({ transactionId: merchantOrderId });
        if (existingOrder) {
            console.log(`Webhook: Order ${merchantOrderId} already processed.`);
            return NextResponse.json({ success: true, message: 'Order already processed.' });
        }
            
        const parts = merchantOrderId.split('-');
        if (parts.length < 3) {
            console.error(`Webhook: Invalid transaction ID format: ${merchantOrderId}`);
            return NextResponse.json({ success: false, message: 'Invalid transaction ID format.' }, { status: 400 });
        }
        const gamingId = parts[1];
        const productId = parts[2];
        
        if (!productId || !gamingId) {
            console.error('Webhook: Missing required data from transaction ID.');
            return NextResponse.json({ success: false, message: 'Missing required data.' }, { status: 400 });
        }

        const product = await db.collection<Product>('products').findOne({ _id: new ObjectId(productId) });
        const user = await db.collection<User>('users').findOne({ gamingId });

        if (!product || !user) {
            console.error(`Webhook: Product or user not found for productId: ${productId}, gamingId: ${gamingId}`);
            return NextResponse.json({ success: false, message: 'Product or user not found.' }, { status: 404 });
        }
            
        const coinsUsed = product.isCoinProduct ? 0 : Math.min(user.coins, product.coinsApplicable || 0);
        let orderStatus: 'Completed' | 'Failed' = 'Failed';

        if (state === 'COMPLETED') {
            orderStatus = 'Completed';
        }

        const newOrder: Omit<Order, '_id'> = {
            userId: user._id.toString(),
            gamingId,
            productId: product._id.toString(),
            productName: product.name,
            productPrice: product.price,
            productImageUrl: product.imageUrl,
            paymentMethod: 'UPI',
            status: orderStatus,
            transactionId: merchantOrderId,
            referralCode: user.referredByCode,
            coinsUsed,
            finalPrice: finalAmount,
            isCoinProduct: product.isCoinProduct,
            createdAt: new Date(),
            coinsAtTimeOfPurchase: user.coins,
        };

        const session = db.client.startSession();
        await session.withTransaction(async () => {
            // Insert the new order. The idempotency check above prevents duplicates.
            await db.collection<Order>('orders').insertOne(newOrder as Order, { session });

            if (orderStatus === 'Completed') {
                // --- 3. Handle successful payment logic ---
                if (product.isCoinProduct) {
                    await db.collection<User>('users').updateOne({ _id: user._id }, { $inc: { coins: product.quantity } }, { session });
                } else if (coinsUsed > 0) {
                    // Only deduct coins on successful completion
                    await db.collection<User>('users').updateOne({ _id: user._id }, { $inc: { coins: -coinsUsed } }, { session });
                }
                
                // Grant referral bonus on successful completion
                if (user.referredByCode) {
                    const rewardAmount = finalAmount * 0.50;
                    await db.collection<LegacyUser>('legacy_users').updateOne({ referralCode: user.referralCode }, { $inc: { walletBalance: rewardAmount } }, { session });
                }

                let notificationMessage = `Your purchase of ${product.name} for ₹${finalAmount} was successful!`;
                 if (product.isCoinProduct) {
                    notificationMessage = `Your purchase of ${product.name} for ₹${finalAmount} was successful! The coins have been added to your account.`
                }

                const newNotification: Omit<Notification, '_id'> = {
                    gamingId,
                    message: notificationMessage,
                    isRead: false,
                    createdAt: new Date(),
                    imageUrl: product.imageUrl,
                };
                await db.collection<Notification>('notifications').insertOne(newNotification as Notification, { session });

                // Set smart visual ID only for successful, non-coin product purchases
                 if (!product.isCoinProduct) {
                    await setSmartVisualId(user);
                }

            } else { // --- 4. Handle failed payment ---
                 const newNotification: Omit<Notification, '_id'> = {
                    gamingId, message: `Your payment of ₹${finalAmount} for ${product.name} failed.`, isRead: false, createdAt: new Date(), imageUrl: product.imageUrl,
                };
                await db.collection<Notification>('notifications').insertOne(newNotification as Notification, { session });
            }
        });
        await session.endSession();

        // Send push notification only for successful orders
        if (orderStatus === 'Completed' && user.fcmToken) {
            let pushTitle = 'Garena Store: Purchase Successful!';
            let pushBody = `Your purchase of ${product.name} for ₹${finalAmount} was successful!`;
            
            await sendPushNotification({ token: user.fcmToken, title: pushTitle, body: pushBody, imageUrl: product.imageUrl });
        }
        
        // Revalidate paths to update caches
        revalidatePath('/');
        revalidatePath('/order');
        revalidatePath('/admin');

        console.log(`Webhook successfully processed order ${merchantOrderId} with status ${orderStatus}`);
        return NextResponse.json({ success: true, message: 'Webhook processed.' });

    } catch (error) {
        console.error('Error processing PhonePe webhook:', error);
        return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 });
    }
}
