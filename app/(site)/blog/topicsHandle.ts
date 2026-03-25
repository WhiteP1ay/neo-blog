import type { HomeExplorerCategory, HomeExplorerPostPreview } from '@/server/actions/posts';

export type BlogCategoryTab = {
  key: string;
  label: string;
  href: string;
};

export type TopicSelectionResolved = 'uncategorized' | string | 'invalid';

/**
 * 解析地址栏 topic：无参或空串视为未分类；合法正整数 id 为专题
 */
export function resolveTopicSelection(raw: string | undefined): TopicSelectionResolved {
  if (raw === undefined || raw === '') {
    return 'uncategorized';
  }
  if (raw === 'uncategorized' || raw === 'all') {
    return 'uncategorized';
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isNaN(n) && String(n) === raw) {
    return String(n);
  }
  return 'invalid';
}

/** ?topic=uncategorized|all 应收敛到 /blog */
export function needsBlogCanonicalTopicRedirect(raw: string | undefined): boolean {
  return raw === 'uncategorized' || raw === 'all';
}

function buildBlogCategoryTabs(categories: HomeExplorerCategory[]): BlogCategoryTab[] {
  return categories.map((c) => ({
    key: c.topicKey === 'uncategorized' ? 'uncategorized' : String(c.topicKey),
    label: c.name,
    href: c.topicKey === 'uncategorized' ? '/blog' : `/blog?topic=${c.topicKey}`,
  }));
}

export type BlogTopicUiState =
  | { ok: false }
  | {
      ok: true;
      listPosts: HomeExplorerPostPreview[];
      activeKey: string;
      tabs: BlogCategoryTab[];
    };

/**
 * 由 explorer 分类数据 + 当前 selection 得到列表、高亮 key、Tab 配置
 */
export function buildBlogTopicUiState(
  categories: HomeExplorerCategory[],
  selection: TopicSelectionResolved,
): BlogTopicUiState {
  if (selection === 'invalid') {
    return { ok: false };
  }

  const topicIds = new Set(
    categories.filter((c) => c.topicKey !== 'uncategorized').map((c) => String(c.topicKey)),
  );

  const tabs = buildBlogCategoryTabs(categories);

  if (selection === 'uncategorized') {
    const cat = categories.find((c) => c.topicKey === 'uncategorized');
    return {
      ok: true,
      listPosts: cat?.posts ?? [],
      activeKey: 'uncategorized',
      tabs,
    };
  }

  if (topicIds.has(selection)) {
    const id = Number.parseInt(selection, 10);
    const cat = categories.find((c) => c.topicKey === id);
    return {
      ok: true,
      listPosts: cat?.posts ?? [],
      activeKey: selection,
      tabs,
    };
  }

  return { ok: false };
}
