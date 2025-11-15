
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { type Product, type User } from '@/lib/definitions';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import { getPhonePeAuthToken } from '@/lib/phonepe-client';

const PHONEPE_HOST_URL = "https://api.phonepe.com/apis/pg";
const PHONEPE_PAY_API = "/v1/pay";

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
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user._id.toString(),
      amount: amount * 100, // Amount in paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/phonepe`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    const options = {
      method: 'POST',
      url: `${PHONEPE_HOST_URL}${PHONEPE_PAY_API}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        accept: 'application/json'
      },
      data: {
        request: base64Payload
      }
    };
    
    const response = await axios.request(options);

    if (response.data.success) {
      const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
      return { success: true, redirectUrl: redirectUrl };
    } else {
       console.error("PhonePe API Error:", response.data.message);
       return { success: false, error: response.data.message || "Failed to create payment link." };
    }

  } catch (error: any) {
    console.error('Error creating PhonePe order:', error.response ? error.response.data : error);
    return { success: false, error: 'Failed to create payment. ' + (error.response?.data?.message || '') };
  }
}
