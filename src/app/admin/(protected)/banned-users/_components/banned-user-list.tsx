'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBannedUsers, handleUnbanUser } from '../actions';
import type { User } from '@/lib/definitions';
import { Input } from '@/components/ui/input';

interface BannedUserListProps {
  initialUsers: User[];
  initialHasMore: boolean;
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
    });
}

export default function BannedUserList({ initialUsers, initialHasMore }: BannedUserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get('sort') || 'desc';

  useEffect(() => {
    setUsers(initialUsers);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialUsers, initialHasMore]);

  const handleLoadMore = async () => {
    startTransition(async () => {
      const nextPage = page + 1;
      const search = searchParams.get('search') || '';
      const { users: newUsers, hasMore: newHasMore } = await getBannedUsers(search, nextPage, sort);
      setUsers(prev => [...prev, ...newUsers]);
      setHasMore(newHasMore);
      setPage(nextPage);
    });
  };

  const handleUnban = (userId: string) => {
    startTransition(async () => {
      const result = await handleUnbanUser(userId);
      if (result.success) {
        toast({ title: 'Success', description: 'User has been unbanned.' });
        setUsers(users.filter(u => u._id.toString() !== userId));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
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

  const handleSortToggle = () => {
    const newSort = sort === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Banned Users</CardTitle>
            <CardDescription>
              A list of all users who are currently banned from the platform.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                name="search"
                placeholder="Search by Gaming ID..."
                defaultValue={searchParams.get('search') || ''}
                className="w-56"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Button variant="outline" onClick={handleSortToggle}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sort === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No banned users found.</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user._id.toString()} className="flex items-center justify-between p-4 bg-destructive/10">
                <div>
                  <p className="font-semibold font-mono">{user.gamingId}</p>
                  <p className="text-sm text-muted-foreground">
                    Banned on: <FormattedDate dateString={user.createdAt as unknown as string} />
                  </p>
                   <p className="text-sm text-destructive mt-1">
                    Reason: {user.banMessage || 'No reason provided.'}
                  </p>
                </div>
                <Button
                  onClick={() => handleUnban(user._id.toString())}
                  disabled={isPending}
                  variant="secondary"
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Unban
                </Button>
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
