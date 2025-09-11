import { getActiveControlRules } from '@/app/actions';
import UserProductControlManager from './_components/user-product-control-manager';

export default async function UserProductControlsPage() {
  const rules = await getActiveControlRules();

  return <UserProductControlManager initialRules={rules} />;
}
