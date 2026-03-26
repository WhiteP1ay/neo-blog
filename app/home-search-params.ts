import { redirect } from "next/navigation";
import type { HomeExplorerCategory } from '@/server/types/explorer';

export type HomePageSearchParamsInput = {
  topic?: string;
  post?: string;
};

/** 首页 topic 查询串：0 为未分类，正整数为专题 id */
export function topicToSearchValue(key: number): string {
  return String(key);
}

/** 首页 redirect 时构造 topic / post 查询串 */
export function buildHomeSearchString(opts: {
  topic: string;
  post?: number;
}) {
  const q = new URLSearchParams();
  q.set("topic", opts.topic);
  if (opts.post != null) {
    q.set("post", String(opts.post));
  }
  return q.toString();
}

export function resolveHomePageSearchParams(
  sp: HomePageSearchParamsInput,
  categories: HomeExplorerCategory[],
): { activeTopicQuery: string; postId: number | null } {
  let topicKey = 0;
  if (sp.topic != null && sp.topic !== "") {
    const n = Number.parseInt(sp.topic, 10);
    if (Number.isNaN(n)) {
      redirect(`/?${buildHomeSearchString({ topic: "0" })}`);
    }
    const found = categories.find((c) => c.topicKey === n);
    if (!found) {
      redirect(`/?${buildHomeSearchString({ topic: "0" })}`);
    }
    topicKey = n;
  }

  const activeTopicQuery = topicToSearchValue(topicKey);
  const currentCat =
    categories.find((c) => c.topicKey === topicKey) ?? categories[0];

  let postId: number | null = null;
  if (sp.post) {
    const p = Number.parseInt(sp.post, 10);
    if (Number.isNaN(p)) {
      redirect(
        `/?${buildHomeSearchString({ topic: activeTopicQuery })}`,
      );
    }
    if (!currentCat.posts.some((x) => x.id === p)) {
      redirect(
        `/?${buildHomeSearchString({ topic: activeTopicQuery })}`,
      );
    }
    postId = p;
  }

  return { activeTopicQuery, postId };
}
