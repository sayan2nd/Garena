
'use server';

import axios from 'axios';
import { URLSearchParams } from 'url';

const PHONEPE_AUTH_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

interface AuthToken {
  access_token: string;
  expires_at: number; // Expiry timestamp in epoch seconds
}

// In-memory cache for the auth token
let cachedToken: AuthToken | null = null;

export async function getPhonePeAuthToken(): Promise<string | null> {
  // If we have a cached token and it's not expired (with a 60-second buffer), return it.
  if (cachedToken && cachedToken.expires_at > (Date.now() / 1000) + 60) {
    return cachedToken.access_token;
  }

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';

  if (!clientId || !clientSecret) {
    console.error('PhonePe client ID or secret is not configured in environment variables.');
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('client_version', clientVersion);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post<AuthToken>(PHONEPE_AUTH_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data && response.data.access_token) {
        cachedToken = response.data;
        return cachedToken.access_token;
    } else {
        console.error('Failed to get access token from PhonePe:', response.data);
        return null;
    }

  } catch (error: any) {
    console.error('Error fetching PhonePe auth token:', error.response ? error.response.data : error.message);
    return null;
  }
}
