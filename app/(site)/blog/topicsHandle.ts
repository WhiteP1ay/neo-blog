import type { HomeExplorerCategory, HomeExplorerPostPreview } from '@/server/types/explorer';

export type BlogCategoryTab = {
  key: string;
  label: string;
  href: string;
};

/** 解析结果：'0' 未分类；合法专题为十进制 id 字符串；非法为 invalid */
export type TopicSelectionResolved = '0' | string | 'invalid';

export function resolveTopicSelection(raw: string | undefined): TopicSelectionResolved {
  if (raw === undefined || raw === '') {
    return '0';
  }
  if (raw === 'all') {
    return '0';
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isNaN(n) && String(n) === raw) {
    return String(n);
  }
  return 'invalid';
}

function buildBlogCategoryTabs(categories: HomeExplorerCategory[]): BlogCategoryTab[] {
  return categories.map((c) => ({
    key: String(c.topicKey),
    label: c.name,
    href: c.topicKey === 0 ? '/blog' : `/blog?topic=${c.topicKey}`,
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
    categories.filter((c) => c.topicKey !== 0).map((c) => String(c.topicKey)),
  );

  const tabs = buildBlogCategoryTabs(categories);

  if (selection === '0') {
    const cat = categories.find((c) => c.topicKey === 0);
    return {
      ok: true,
      listPosts: cat?.posts ?? [],
      activeKey: '0',
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
