
'use client';

import { useEffect } from 'react';
import { markPurchaseAsTracked } from '@/app/actions/tracking';

declare global {
    interface Window {
        fbq: (...args: any[]) => void;
    }
}

interface MetaPixelTrackerProps {
    orderId: string;
    price: number;
}

export default function MetaPixelTracker({ orderId, price }: MetaPixelTrackerProps) {

    useEffect(() => {
        // Ensure fbq is available
        if (typeof window.fbq === 'function') {
            console.log(`Tracking purchase for order ${orderId} with price ${price}`);
            
            // Fire the Meta Pixel 'Purchase' event
            window.fbq('track', 'Purchase', {
                value: price,
                currency: 'INR',
            });
            
            // Mark the purchase as tracked on the server to prevent re-tracking
            markPurchaseAsTracked(orderId).catch(error => {
                console.error("Failed to mark purchase as tracked:", error);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, price]);

    // This component renders nothing to the DOM
    return null;
}
