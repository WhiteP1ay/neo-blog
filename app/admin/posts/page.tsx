import { AdminConsole } from '../AdminConsole';
import { firstSearchParam } from '@/lib/blog-list-query';

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (firstSearchParam(sp.uncategorized) === '1') {
    return <AdminConsole initialTab="posts" showTabNav={false} postsSelectedType="" />;
  }
  const t = firstSearchParam(sp.type);
  if (t !== undefined && t !== '') {
    return <AdminConsole initialTab="posts" showTabNav={false} postsSelectedType={t} />;
  }
  return <AdminConsole initialTab="posts" showTabNav={false} />;
}
