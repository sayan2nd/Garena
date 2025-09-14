
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { type Order } from '@/lib/definitions';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(req: NextRequest) {
  noStore();
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({ success: false, message: 'Transaction ID is required.' }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    
    const recentOrder = await db.collection<Order>('orders').findOne({
      transactionId: transactionId,
      status: { $in: ['Completed', 'Processing'] }
    });

    if (recentOrder) {
      return NextResponse.json({ success: true, orderFound: true });
    } else {
      return NextResponse.json({ success: true, orderFound: false });
    }
  } catch (error) {
    console.error('Error checking order status:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
