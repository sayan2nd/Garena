'use client';

import { getUserId } from '@/lib/user-actions';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Using a mock fetch function as we can't call server actions from a useEffect hook
// in this file structure. In a real app, this would be an API endpoint.
async function getOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/orders?userId=${userId}`);
    if (!response.ok) {
      console.error('Failed to fetch orders');
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return null; // Don't render on the server
    }

    try {
        const date = new Date(dateString);
         // Using en-IN locale for India and Asia/Kolkata timezone
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        });
    } catch (error) {
        return dateString; // Fallback to original string if date is invalid
    }
}


export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = await getUserId();
      if (userId) {
        // This is a placeholder for fetching user-specific data on the client
        // In a real app, you would fetch this from an API route
        const db = await connectToDatabase();
        const userOrders = await db.collection('orders').find({ userId }).sort({ createdAt: -1 }).toArray();
        setOrders(JSON.parse(JSON.stringify(userOrders)));
      }
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <p>Loading your orders...</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary text-center flex-grow">
          Your Orders
        </h1>
        <Button asChild variant="outline">
          <Link href="/refund-request">
            <RotateCcw className="mr-2 h-4 w-4" />
            Request a Refund
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="max-w-2xl mx-auto text-center py-12">
           <CardHeader>
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground">You haven't placed any orders. Start shopping to see your orders here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card key={order._id.toString()} className="flex flex-col overflow-hidden">
               <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
                 <div className="flex-grow">
                    <CardTitle className="text-lg leading-tight">{order.productName}</CardTitle>
                    <CardDescription className="text-sm mt-1">Gaming ID: {order.gamingId}</CardDescription>
                 </div>
                 <Badge 
                    variant={
                        order.status === 'Completed' ? 'default' : 
                        order.status === 'Processing' ? 'secondary' : 
                        'destructive'
                    }
                    className={cn(order.status === 'Completed' && 'bg-green-500/80 text-white')}
                >
                    {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <div className="relative aspect-video w-full">
                    <Image src={order.productImageUrl} alt={order.productName} fill className="object-cover rounded-md" />
                </div>
                 <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/refund-request">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Request a Refund
                    </Link>
                  </Button>
              </CardContent>
              <CardFooter className="bg-muted/40 p-4 text-sm text-muted-foreground flex justify-between items-center">
                <span><FormattedDate dateString={order.createdAt as unknown as string} /></span>
                <span className="font-bold text-foreground">${order.productPrice}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
