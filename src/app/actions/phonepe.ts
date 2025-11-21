
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { type Product, type User } from '@/lib/definitions';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import { getPhonePeAuthToken } from '@/lib/phonepe-client';

const PHONEPE_HOST_URL = "https://api.phonepe.com/apis/pg";
const PHONEPE_PAY_API = "/checkout/v2/pay";

export async function createPhonePeOrder(
  amount: number,
  gamingId: string,
  productId: string,
  transactionId: string
) {
  noStore();

  const authToken = await getPhonePeAuthToken();
  if (!authToken) {
    return { success: false, error: 'Could not authenticate with PhonePe.' };
  }

  try {
    const db = await connectToDatabase();
    const product = await db.collection<Product>('products').findOne({ _id: new ObjectId(productId) });
    const user = await db.collection<User>('users').findOne({ gamingId });
    if (!product || !user) {
      return { success: false, error: 'User or product not found.' };
    }

    const payload = {
      merchantOrderId: transactionId,
      amount: amount * 100, // Amount in paise
      metaInfo: {
        udf1: gamingId,
        udf2: product.name,
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
            redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order?orderId=${transactionId}`
        }
      }
    };
    
    const options = {
      method: 'POST',
      url: `${PHONEPE_HOST_URL}${PHONEPE_PAY_API}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`,
        accept: 'application/json'
      },
      data: payload
    };
    
    const response = await axios.request(options);
    
    if (response.data.orderId && response.data.redirectUrl) {
      const redirectUrl = response.data.redirectUrl;
      // Return the URL instead of redirecting from the server
      return { success: true, redirectUrl: redirectUrl };
    } else {
       console.error("PhonePe API Error:", response.data.message);
       return { success: false, error: response.data.message || "Failed to create payment link." };
    }

  } catch (error: any) {
    console.error('Error creating PhonePe order:', error.response ? error.response.data : error);
    return { success: false, error: 'Failed to create payment. ' + (error.response?.data?.message || 'Bad Request') };
  }
}
