import { redirect } from "next/navigation";
import { SITE_SHEET_QUERY_KEY, isSiteSheetModalId } from "@/app/nav";
import type { HomeExplorerCategory } from "@/server/actions/posts";

export type HomePageSearchParamsInput = {
  topic?: string;
  post?: string;
  sheet?: string;
};

export function topicToSearchValue(key: "uncategorized" | number): string {
  return key === "uncategorized" ? "uncategorized" : String(key);
}

/** 首页 redirect 时保留合法的 sheet 查询（与弹窗同步） */
export function buildHomeSearchString(opts: {
  topic: string;
  post?: number;
  sheet?: string;
}) {
  const q = new URLSearchParams();
  q.set("topic", opts.topic);
  if (opts.post != null) {
    q.set("post", String(opts.post));
  }
  if (opts.sheet != null && isSiteSheetModalId(opts.sheet)) {
    q.set(SITE_SHEET_QUERY_KEY, opts.sheet);
  }
  return q.toString();
}

export function resolveHomePageSearchParams(
  sp: HomePageSearchParamsInput,
  categories: HomeExplorerCategory[],
): { activeTopicQuery: string; postId: number | null } {
  const sheetPreserve = sp.sheet;

  let topicKey: "uncategorized" | number = "uncategorized";
  if (sp.topic && sp.topic !== "uncategorized") {
    const n = Number.parseInt(sp.topic, 10);
    if (Number.isNaN(n)) {
      redirect(
        `/?${buildHomeSearchString({ topic: "uncategorized", sheet: sheetPreserve })}`,
      );
    }
    const found = categories.find((c) => c.topicKey === n);
    if (!found) {
      redirect(
        `/?${buildHomeSearchString({ topic: "uncategorized", sheet: sheetPreserve })}`,
      );
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
        `/?${buildHomeSearchString({ topic: activeTopicQuery, sheet: sheetPreserve })}`,
      );
    }
    if (!currentCat.posts.some((x) => x.id === p)) {
      redirect(
        `/?${buildHomeSearchString({ topic: activeTopicQuery, sheet: sheetPreserve })}`,
      );
    }
    postId = p;
  }

  return { activeTopicQuery, postId };
}
