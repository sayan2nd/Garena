
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ArrowUpDown, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNotifications, deleteNotification } from '../actions';
import type { Notification } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface NotificationListProps {
  initialNotifications: Notification[];
  initialHasMore: boolean;
  totalNotifications: number;
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
}

const NotificationMedia = ({ src, alt }: { src: string; alt: string }) => {
  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');

  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
    />
  );
};

const ClickableMessage = ({ message }: { message: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);

  return (
    <p className="text-sm">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};


export default function NotificationList({ initialNotifications, initialHasMore, totalNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'desc';

  useEffect(() => {
    setNotifications(initialNotifications);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialNotifications, initialHasMore]);

  const handleLoadMore = async () => {
    startTransition(async () => {
      const nextPage = page + 1;
      const { notifications: newNotifications, hasMore: newHasMore } = await getNotifications(nextPage, search, sort);
      setNotifications(prev => [...prev, ...newNotifications]);
      setHasMore(newHasMore);
      setPage(nextPage);
    });
  };
  
  const handleSortToggle = () => {
    const newSort = sort === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    const params = new URLSearchParams(searchParams);
    params.set('search', searchQuery);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (notificationId: string) => {
    startTransition(async () => {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n._id.toString() !== notificationId));
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Users Notification</CardTitle>
            <Badge variant="secondary">{totalNotifications}</Badge>
          </div>
          <div className="flex items-center gap-2">
             <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input name="search" placeholder="Search by Gaming ID..." defaultValue={search} className="w-56"/>
                <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
            </form>
            <Button variant="outline" onClick={handleSortToggle}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sort === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
        </div>
        <CardDescription>
          A list of all notifications sent to users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No notifications found.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification._id.toString()} className="flex flex-col">
                <CardHeader className="flex flex-row justify-between items-start pb-2">
                  <div>
                    <CardTitle className="text-base font-mono">{notification.gamingId}</CardTitle>
                    <CardDescription><FormattedDate dateString={notification.createdAt as unknown as string} /></CardDescription>
                  </div>
                  <Badge variant={notification.isRead ? "secondary" : "default"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ClickableMessage message={notification.message} />
                   {notification.imageUrl && (
                    <div className="mt-4 relative aspect-video w-full max-w-sm rounded-md overflow-hidden">
                        <NotificationMedia src={notification.imageUrl} alt="Notification media" />
                    </div>
                   )}
                </CardContent>
                <CardFooter className="flex justify-end bg-muted/40 p-2">
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" disabled={isPending}>
                              <Trash2 className="h-4 w-4"/>
                           </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this notification. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(notification._id.toString())}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
       {hasMore && (
        <CardFooter className="justify-center">
            <Button onClick={handleLoadMore} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
