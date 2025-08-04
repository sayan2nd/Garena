'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import PurchaseModal from './purchase-modal';
import type { Product } from '@/lib/definitions';
import { Ban } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative aspect-video">
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.dataAiHint}/>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse mb-1">
            Quantity: {product.quantity}
          </div>
          <CardTitle className="text-lg font-headline font-semibold">{product.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {product.isAvailable ? (
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base transition-transform duration-200 hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              Buy (${product.price})
            </Button>
          ) : (
            <Button 
              className="w-full font-bold text-base"
              disabled
              variant="secondary"
            >
              <Ban className="mr-2 h-4 w-4" />
              Item Unavailable
            </Button>
          )}
        </CardFooter>
      </Card>
      {isModalOpen && <PurchaseModal product={product} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
