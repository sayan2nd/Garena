import { getVanishedProducts } from '@/app/actions';
import VanishedProductList from './_components/vanished-product-list';

export default async function VanishedProductsPage() {
  const products = await getVanishedProducts();
  return <VanishedProductList initialProducts={products} />;
}
