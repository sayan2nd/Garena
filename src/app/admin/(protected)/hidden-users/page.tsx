import { getHiddenUsersForAdmin } from '@/app/actions';
import HiddenUserList from './_components/hidden-user-list';

export default async function HiddenUsersPage() {
  const users = await getHiddenUsersForAdmin();
  return <HiddenUserList initialUsers={users} />;
}
