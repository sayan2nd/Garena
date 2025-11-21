import { getBannedUsers } from './actions';
import BannedUserList from './_components/banned-user-list';

export default async function BannedUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'desc';

  const { users, hasMore } = await getBannedUsers(search, page, sort);

  return <BannedUserList initialUsers={users} initialHasMore={hasMore} />;
}
