import { formatDate } from '@/app/utils/date';

interface PostHeaderProps {
  title: string;
  createdAt: Date | null;
  publishedTime?: string;
}

export function PostHeader({ title, createdAt, publishedTime }: PostHeaderProps) {
  return (
    <header>
      <h1 className="text-foreground mb-4 text-2xl font-bold sm:mb-6 sm:text-4xl">{title}</h1>
      {createdAt ? (
        <time dateTime={publishedTime} className="text-muted-foreground mb-6 block text-xs sm:mb-8 sm:text-sm">
          {formatDate(createdAt)}
        </time>
      ) : null}
    </header>
  );
}
