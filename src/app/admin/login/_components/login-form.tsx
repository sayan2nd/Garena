'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { verifyAdminPassword } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Verifying...' : 'Login'}
    </Button>
  );
}

export default function LoginForm() {
  const { toast } = useToast();
  
  const [state, formAction] = useActionState(verifyAdminPassword, undefined);

  useEffect(() => {
    if (state?.message && !state.success) {
      toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: state.message
      })
    }
  }, [state, toast]);


  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
