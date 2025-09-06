'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { unhideUser } from '@/app/actions';
import type { User } from '@/lib/definitions';
import Link from 'next/link';

interface HiddenUserListProps {
  initialUsers: User[];
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

export default function HiddenUserList({ initialUsers }: HiddenUserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleUnhide = (userId: string) => {
    startTransition(async () => {
      const result = await unhideUser(userId);
      if (result.success) {
        toast({ title: 'Success', description: 'User unhidden successfully.' });
        setUsers(users.filter(p => p._id.toString() !== userId));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hidden Users</CardTitle>
        <CardDescription>
          These users are hidden from the main user management list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <p className="text-muted-foreground">No hidden users.</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user._id.toString()} className="flex items-center justify-between p-4 bg-muted/50">
                <div>
                  <p className="font-semibold font-mono">{user.gamingId}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined: <FormattedDate dateString={user.createdAt as unknown as string} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="icon">
                        <Link href={`/admin/all-orders?search=${user.gamingId}`} target="_blank">
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button 
                    onClick={() => handleUnhide(user._id.toString())} 
                    disabled={isPending}
                    variant="secondary"
                    >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Unhide
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
