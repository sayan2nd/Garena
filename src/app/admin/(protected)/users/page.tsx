import UserList from './_components/user-list';
import { getUsersForAdmin } from '@/app/actions';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'visits'; // Default to visits
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';

  const { users, hasMore } = await getUsersForAdmin(page, sort, search);

  return (
    <UserList
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialHasMore={hasMore}
    />
  );
}
