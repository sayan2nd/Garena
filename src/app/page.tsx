import ImageSlider from '@/components/image-slider';
import ProductCard from '@/components/product-card';
import FaqChatbot from '@/components/faq-chatbot';
import { getProducts } from './actions';

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="flex flex-col">
      <ImageSlider />
      <section className="w-full py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-8 md:mb-12 text-foreground">
            Top Up Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>
      <FaqChatbot />
    </div>
  );
}
