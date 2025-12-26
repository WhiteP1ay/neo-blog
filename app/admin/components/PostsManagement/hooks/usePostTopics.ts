"use client";

import { useState, useEffect } from "react";
import { getTopicsByPostId } from "@/server/actions/topics";
import type { Post } from "@/server/actions/posts";
import type { Topic } from "@/server/actions/topics";

/**
 * Hook: 获取文章所属的专题
 */
export function usePostTopics(posts: Post[]) {
  const [postTopicsMap, setPostTopicsMap] = useState<Map<number, Topic[]>>(
    new Map()
  );

  useEffect(() => {
    const loadTopics = async () => {
      const map = new Map<number, Topic[]>();

      for (const post of posts) {
        const result = await getTopicsByPostId(post.id);
        if (result.success && result.data) {
          map.set(post.id, result.data);
        }
      }

      setPostTopicsMap(map);
    };

    if (posts.length > 0) {
      loadTopics();
    } else {
      setPostTopicsMap(new Map());
    }
  }, [posts]);

  return postTopicsMap;
}
