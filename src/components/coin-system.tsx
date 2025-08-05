
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Coins, Tv } from 'lucide-react';
import type { User } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { transferCoins } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import GamingIdModal from './gaming-id-modal';
import { Button } from './ui/button';

interface CoinSystemProps {
  user: User | null;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Sending...' : 'Send Coins'}
        </Button>
    )
}

export default function CoinSystem({ user }: CoinSystemProps) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [hasModalBeenDismissed, setHasModalBeenDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If user is not logged in, modal hasn't been dismissed, and it's not already open, then show it.
    if (!user && !hasModalBeenDismissed && !isRegisterModalOpen) {
      const timer = setTimeout(() => setIsRegisterModalOpen(true), 1500); // Delay before showing
      return () => clearTimeout(timer);
    }
  }, [user, isRegisterModalOpen, hasModalBeenDismissed]);
  
  const handleTransfer = async (formData: FormData) => {
    const recipientGamingId = formData.get('recipientId') as string;
    const amount = Number(formData.get('amount'));
    
    const result = await transferCoins(recipientGamingId, amount);
    if (result.success) {
      toast({ title: 'Success!', description: result.message });
      setIsTransferOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  }

  const handleUnregisteredClick = (e: React.MouseEvent) => {
    if (!user) {
        e.preventDefault();
        setIsRegisterModalOpen(true);
    }
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsRegisterModalOpen(isOpen);
    // If modal is being closed and user is still not registered, mark as dismissed.
    if (!isOpen && !user) {
      setHasModalBeenDismissed(true);
    }
  };
  
  return (
    <>
      <GamingIdModal isOpen={isRegisterModalOpen} onOpenChange={handleModalOpenChange} />
      <section className="w-full py-6 bg-muted/40 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-center items-stretch gap-4">
            
            <Link 
              href="/watch-ad"
              onClick={handleUnregisteredClick} 
              className="flex-1 max-w-[100px] sm:max-w-[120px]"
            >
              <Card className="hover:bg-primary/5 transition-colors h-full">
                <CardContent className="p-2 flex flex-col items-center justify-center text-center min-h-[70px] w-[100px] sm:w-[120px]">
                    <Tv className="w-5 h-5 mx-auto text-primary" />
                    <p className="font-semibold mt-1 text-xs">Watch Ad</p>
                    <p className="text-xs text-muted-foreground">(+5 Coins)</p>
                </CardContent>
              </Card>
            </Link>
            
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                  <div onClick={handleUnregisteredClick} className="flex-1 max-w-[100px] sm:max-w-[120px] cursor-pointer">
                      <Card className="hover:bg-primary/5 transition-colors h-full">
                        <CardContent className="p-2 flex flex-col items-center justify-center text-center min-h-[70px] w-[100px] sm:w-[120px]">
                            <Coins className="w-5 h-5 mx-auto text-amber-500" />
                            <p className="font-semibold mt-1 text-xs">{user ? `${user.coins} Coins` : "Your Wallet"}</p>
                             <p className="text-xs text-muted-foreground">&nbsp;</p>
                        </CardContent>
                      </Card>
                  </div>
              </DialogTrigger>

              {user && (
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Coins</DialogTitle>
                      <DialogDescription>
                        Send coins to another user. This action is irreversible. Your current balance is {user.coins}.
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleTransfer} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipientId">Recipient's Gaming ID</Label>
                        <Input id="recipientId" name="recipientId" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" required min="1" max={user.coins} />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton />
                      </DialogFooter>
                    </form>
                  </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </section>
    </>
  );
}
