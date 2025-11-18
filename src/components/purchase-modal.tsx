

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product, User } from '@/lib/definitions';
import { Loader2, X, Smartphone, Globe, Coins, ShieldCheck, ShoppingCart, Check } from 'lucide-react';
import Image from 'next/image';
import { createRedeemCodeOrder, registerGamingId as registerAction } from '@/app/actions';
import { createPhonePeOrder } from '@/app/actions/phonepe';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { checkPurchaseEligibility } from '@/app/actions/check-purchase-eligibility';
import { useRefresh } from '@/context/RefreshContext';
import { cn } from '@/lib/utils';
import ProductMedia from './product-media';

// The product passed to this modal has its _id serialized to a string
interface ProductWithStringId extends Omit<Product, '_id'> {
  _id: string;
}

interface PurchaseModalProps {
  product: ProductWithStringId;
  user: User | null;
  onClose: () => void;
}

type ModalStep = 'verifying' | 'register' | 'details' | 'processing' | 'success';

declare global {
  interface Window {
    PhonePeCheckout?: {
      transact: (options: { tokenUrl: string, type: 'IFRAME', callback: (response: any) => void }) => void;
      closePage: () => void;
    };
  }
}


export default function PurchaseModal({ product, user: initialUser, onClose }: PurchaseModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState<User | null>(initialUser);
  const [step, setStep] = useState<ModalStep>(initialUser ? 'verifying' : 'register');
  const [gamingId, setGamingId] = useState(initialUser?.gamingId || '');
  const [redeemCode, setRedeemCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const eligibilityCheckPerformed = useRef(false);
  const { triggerRefresh } = useRefresh();


  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentTransactionId(null);
    setTimeout(onClose, 300); // Allow for closing animation
  }, [onClose]);

  useEffect(() => {
    if (step === 'verifying' && user && !eligibilityCheckPerformed.current) {
        eligibilityCheckPerformed.current = true; // Mark as performed immediately
        checkPurchaseEligibility(user._id.toString(), product._id)
            .then(result => {
                if (result.eligible) {
                    setStep('details');
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Not Eligible',
                        description: result.message
                    });
                    handleClose();
                    router.refresh(); // Refresh page to show updated state
                }
            });
    }
  }, [step, user, product._id, handleClose, router, toast]);

  useEffect(() => {
    // If the modal is open, and a user gets passed in (e.g. after registration), move to details
    if (isOpen && initialUser && step === 'register') {
      setUser(initialUser);
      setGamingId(initialUser.gamingId);
      setStep('verifying');
    }
  }, [initialUser, isOpen, step]);

  const handleRegister = async () => {
    if (!gamingId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter your Gaming ID.' });
      return;
    }
    setIsLoading(true);
    const result = await registerAction(gamingId);
    if (result.success && result.user) {
        toast({ title: 'Success', description: result.message });
        window.location.reload();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
        setIsLoading(false);
    }
  };

  const coinsToUse = user && !product.isCoinProduct ? Math.min(user.coins, product.coinsApplicable || 0) : 0;
  const finalPrice = product.isCoinProduct 
    ? product.purchasePrice || product.price 
    : product.price - coinsToUse;
  
  const handlePaymentCallback = useCallback((response: any) => {
    if (response === 'USER_CANCEL') {
      toast({
        variant: 'destructive',
        title: 'Payment Cancelled',
        description: 'You cancelled the payment process.',
      });
    } else if (response === 'CONCLUDED') {
        setStep('success');
    }
    setTimeout(() => {
        handleClose();
    }, 3000);
  }, [handleClose, toast]);

  const handleBuyWithUpi = async () => {
    setIsLoading(true);
    
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.'});
        setIsLoading(false);
        return;
    }
    
    const uniqueTransactionId = `${Date.now()}-${user.gamingId}-${product._id}`;
    setCurrentTransactionId(uniqueTransactionId);

    const result = await createPhonePeOrder(finalPrice, user.gamingId, product._id, uniqueTransactionId);

    if (result.success && result.redirectUrl) {
        if (window.PhonePeCheckout) {
            window.PhonePeCheckout.transact({
                tokenUrl: result.redirectUrl,
                type: 'IFRAME',
                callback: handlePaymentCallback
            });
            setTimeout(() => {
                handleClose();
            }, 4000);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'PhonePe Checkout script not loaded. Please refresh.' });
        }
    } else {
        toast({ variant: 'destructive', title: 'Payment Error', description: result.error || 'Could not create payment link.' });
    }
    setIsLoading(false);
  };


  const handleRedeemSubmit = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        return;
    }
    if (!redeemCode) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter your redeem code.' });
        return;
    }
    setIsLoading(true);
    const result = await createRedeemCodeOrder(product, user.gamingId, redeemCode, user);
    if (result.success) {
        setStep('processing');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsLoading(false);
  }
  
  const renderContent = () => {
    switch (step) {
      case 'verifying':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Please Wait</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <h2 className="text-xl font-semibold"></h2>
                    <p className="text-muted-foreground"></p>
                </div>
            </>
        );
      case 'register':
        return (
             <>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">Welcome to Garena Store</DialogTitle>
                    <DialogDescription>Please enter your Gaming ID to continue.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="gaming-id-register">Gaming ID</Label>
                        <Input id="gaming-id-register" placeholder="Your in-game user ID" value={gamingId} onChange={e => setGamingId(e.target.value.replace(/\D/g, ''))} type="tel" pattern="[0-9]*" />
                    </div>
                    <Button onClick={handleRegister} className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Register & Continue'}
                    </Button>
                </div>
            </>
        )
      case 'details':
        if (!user) return null; // Should not happen if step is 'details'
        return (
          <>
            <DialogHeader>
                <div className="flex items-center gap-2 mb-4">
                    <Image src="/img/garena.png" alt="Garena Logo" width={28} height={28} />
                    <DialogTitle className="text-2xl font-headline">Confirm Purchase</DialogTitle>
                </div>
            </DialogHeader>
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                        <ProductMedia src={product.imageUrl} alt={product.name} />
                    </div>
                    <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        {!product.isCoinProduct && <p className="text-sm text-muted-foreground line-through font-sans">Original Price: ₹{product.price}</p>}
                        {coinsToUse > 0 && !product.isCoinProduct && <p className="text-sm text-amber-600 flex items-center font-sans gap-1"><Coins className="w-4 h-4"/> Coins Applied: -₹{coinsToUse}</p>}
                        {product.isCoinProduct && <p className="text-sm text-muted-foreground line-through font-sans">Original Price: ₹{product.price}</p>}
                        <p className="text-2xl font-bold text-primary font-sans">Final Price: ₹{finalPrice}</p>
                    </div>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="server">Server</Label>
                  <Select defaultValue="india" onValueChange={(value) => {
                    if (value !== 'india') {
                      toast({
                        variant: 'default',
                        title: 'Server Information',
                        description: 'Only the India server is supported at this time.',
                      })
                    }
                  }}>
                    <SelectTrigger id="server" className="w-full">
                      <SelectValue placeholder="Select a server" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          India
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gaming-id">Gaming ID</Label>
                    <Input id="gaming-id" value={user.visualGamingId || user.gamingId} readOnly disabled />
                </div>
                <div className="space-y-2">
                   <Button onClick={handleBuyWithUpi} className="w-full font-sans" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : `Pay ₹${finalPrice} via UPI`}
                    </Button>
                    {!product.onlyUpi && !user.isRedeemDisabled && (
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full font-sans" variant="secondary" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : `Use Redeem Code`}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-headline">Use Redeem Code</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="redeem-code">Enter your Redeem Code</Label>
                                        <Input id="redeem-code" placeholder="XXXX-XXXX-XXXX" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} />
                                    </div>
                                    <Button onClick={handleRedeemSubmit} className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="animate-spin" /> : `Submit Code & Buy`}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    By continuing, you accept our{' '}
                    <Link href="/terms" className="underline hover:text-primary" onClick={handleClose}>
                        Terms & Conditions
                    </Link>
                    .
                </p>
            </div>
          </>
        );
    case 'processing':
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-xl font-headline">Processing Order</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <h2 className="text-2xl font-semibold">Order Under Processing</h2>
                    <p className="text-muted-foreground">Your order has been received and is now being processed. This usually takes just a few moments.</p>
                    <p>You can track the status of your order on the "Order" page.</p>
                    <Button asChild onClick={handleClose}><Link href="/order">Go to Orders Page</Link></Button>
                </div>
            </>
        );
      case 'success':
        return (
            <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-16 h-16 text-white stroke-[3] animate-in zoom-in-50" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-headline text-green-600 mb-2">Payment Processing</h2>
                <p className="text-muted-foreground mb-4">Your payment has been submitted. Please wait for confirmation.</p>
                <p className="text-sm">You will be redirected to the order page shortly.</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-6 overflow-hidden">
                    <div className="bg-green-500 h-1 rounded-full animate-progress-smooth" style={{'--duration': '3s', animationDelay: '0.5s', transform: 'translateX(-100%)'} as React.CSSProperties}></div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" hideCloseButton={step === 'success'}>
        {step !== 'success' && (
            <DialogClose asChild>
                <button onClick={handleClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
                </button>
            </DialogClose>
        )}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
