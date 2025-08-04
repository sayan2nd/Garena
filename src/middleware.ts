import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Handle user ID
  let userId = request.cookies.get('user_id')?.value;
  if (!userId) {
    const randomValues = new Uint8Array(16);
    crypto.getRandomValues(randomValues);
    const newUserId = Array.from(randomValues).map(b => b.toString(16).padStart(2, '0')).join('');
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
      maxAge: 7 * 24 * 60 * 60, // 1 week
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
