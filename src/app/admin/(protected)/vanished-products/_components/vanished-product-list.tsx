'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArchiveRestore } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { restoreProduct } from '@/app/actions';
import type { Product } from '@/lib/definitions';

interface VanishedProductListProps {
  initialProducts: Product[];
}

export default function VanishedProductList({ initialProducts }: VanishedProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRestore = (productId: string) => {
    startTransition(async () => {
      const result = await restoreProduct(productId);
      if (result.success) {
        toast({ title: 'Success', description: 'Product restored successfully.' });
        setProducts(products.filter(p => p._id !== productId));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vanished Products</CardTitle>
        <CardDescription>
          These products are hidden from the storefront. You can restore them here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-muted-foreground">No vanished products.</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">Price: ${product.price}</p>
                </div>
                <Button 
                  onClick={() => handleRestore(product._id)} 
                  disabled={isPending}
                  variant="outline"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <ArchiveRestore className="mr-2" />}
                  Restore
                </Button>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
