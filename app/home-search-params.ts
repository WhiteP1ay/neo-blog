import { redirect } from "next/navigation";
import type { HomeExplorerCategory } from "@/server/actions/posts";

export type HomePageSearchParamsInput = {
  topic?: string;
  post?: string;
};

export function topicToSearchValue(key: "uncategorized" | number): string {
  return key === "uncategorized" ? "uncategorized" : String(key);
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
  let topicKey: "uncategorized" | number = "uncategorized";
  if (sp.topic && sp.topic !== "uncategorized") {
    const n = Number.parseInt(sp.topic, 10);
    if (Number.isNaN(n)) {
      redirect(`/?${buildHomeSearchString({ topic: "uncategorized" })}`);
    }
    const found = categories.find((c) => c.topicKey === n);
    if (!found) {
      redirect(`/?${buildHomeSearchString({ topic: "uncategorized" })}`);
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
