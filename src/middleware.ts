import { NextResponse, type NextRequest } from 'next/server';
import { ensureUserId } from './app/actions';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Ensure user has a unique ID
  const userId = request.cookies.get('user_id')?.value;
  if (!userId) {
      const newUserId = await ensureUserId();
      response.cookies.set('user_id', newUserId, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    });
  }

  // Handle referral codes
  const referralCode = request.nextUrl.searchParams.get('ref');
  if (referralCode) {
    response.cookies.set('referral_code', referralCode, {
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: ['/', '/order'], // Apply middleware to home and order page
};
