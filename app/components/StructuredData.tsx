/**
 * JSON-LD 结构化数据组件
 * 用于 SEO 优化，支持不同类型的 Schema.org 结构化数据
 */

interface StructuredDataProps {
  /**
   * 结构化数据对象
   */
  data: Record<string, unknown>;
}

/**
 * 结构化数据组件
 * 将 JSON-LD 数据注入到页面中，用于 SEO
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * 创建博客文章的结构化数据
 */
export function createBlogPostingSchema({
  headline,
  description,
  datePublished,
  dateModified,
  author = { "@type": "Person", name: "whitePlay" },
  publisher = { "@type": "Organization", name: "White Meta" },
}: {
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  author?: { "@type": string; name: string };
  publisher?: { "@type": string; name: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author,
    publisher,
    description,
  };
}

