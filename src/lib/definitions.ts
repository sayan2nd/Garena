import { type ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  username: string;
  password:  string;
  referralCode?: string;
  referredBy?: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    dataAiHint: string;
}

export interface Order {
    _id: ObjectId;
    userId: string; // The unique ID assigned to the user/browser session
    gamingId: string;
    productId: string;
    productName: string;
    productPrice: number;
    productImageUrl: string;
    paymentMethod: 'UPI' | 'Redeem Code';
    status: 'Pending UTR' | 'Processing' | 'Completed' | 'Failed';
    utr?: string;
    redeemCode?: string;
    referralCode?: string;
    createdAt: Date;
}
