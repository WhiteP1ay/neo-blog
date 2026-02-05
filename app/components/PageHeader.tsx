import Link from "next/link";
import Image from "next/image";

interface PageHeaderProps {
  title: string;
  avatar?: {
    src: string;
    alt: string;
  };
  authorLink?: {
    href: string;
    label: string;
  };
}

/**
 * 页面头部组件
 */
export function PageHeader({ title, avatar, authorLink }: PageHeaderProps) {
  return (
    <header className="mb-8 sm:mb-12 flex items-center justify-between">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        {title}
      </h1>
      {avatar && authorLink && (
        <div className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={avatar.src}
            alt={avatar.alt}
            width={32}
            height={32}
          />
          <Link href={authorLink.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
            {authorLink.label}
          </Link>
        </div>
      )}
    </header>
  );
}

