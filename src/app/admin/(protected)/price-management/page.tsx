import { getProducts } from '@/app/actions';
import PriceManagementList from './_components/price-management-list';

export default async function PriceManagementPage() {
  const products = await getProducts();
  return <PriceManagementList initialProducts={products} />;
}
