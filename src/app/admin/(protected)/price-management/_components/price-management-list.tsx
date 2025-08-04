'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProduct, vanishProduct } from '@/app/actions';
import type { Product } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PriceManagementListProps {
  initialProducts: Product[];
}

export default function PriceManagementList({ initialProducts }: PriceManagementListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleUpdate = (productId: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateProduct(productId, formData);
      if (result.success) {
        toast({ title: 'Success', description: 'Product updated successfully.' });
        setProducts(products.map(p => p._id === productId ? { ...p, ...Object.fromEntries(formData.entries()), price: parseFloat(formData.get('price') as string) } : p));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleVanish = (productId: string) => {
    startTransition(async () => {
      const result = await vanishProduct(productId);
      if (result.success) {
        toast({ title: 'Success', description: 'Product vanished.' });
        setProducts(products.filter(p => p._id !== productId));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price & Product Management</CardTitle>
        <CardDescription>
          Update product details, availability, and visibility. Changes will be reflected on the homepage immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {products.map((product) => (
          <form key={product._id} action={(formData) => handleUpdate(product._id, formData)}>
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`name-${product._id}`}>Product Name</Label>
                  <Input
                    id={`name-${product._id}`}
                    name="name"
                    defaultValue={product.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`price-${product._id}`}>Price ($)</Label>
                  <Input
                    id={`price-${product._id}`}
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={product.price}
                  />
                </div>
                <div className="flex items-end justify-between">
                    <div className="space-y-2">
                        <Label htmlFor={`isAvailable-${product._id}`}>Available</Label>
                        <div className="flex items-center h-10">
                            <Switch
                            id={`isAvailable-${product._id}`}
                            name="isAvailable"
                            defaultChecked={product.isAvailable}
                            />
                        </div>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/40 p-4">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button" disabled={isPending}>
                            <Trash2 className="mr-2" /> Vanish
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently hide this product from the storefront. It cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleVanish(product._id)}>
                            Yes, Vanish Product
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
