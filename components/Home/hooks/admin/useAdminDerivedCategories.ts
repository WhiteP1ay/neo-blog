'use client';

import { useMemo } from 'react';
import type { HomeExplorerCategoryPayload } from '../../type/payload';

/**
 * 从后端 payload 派生出专题栏需要的分类分组。
 */
export function useAdminDerivedCategories(categories: HomeExplorerCategoryPayload[]) {
  return useMemo(() => {
    const unc = categories[0];
    const real = categories.slice(1);
    return {
      uncategorizedCategory: unc,
      pinnedTopicCategories: real.filter((c) => c.isPinned),
      unpinnedTopicCategories: real.filter((c) => !c.isPinned),
    };
  }, [categories]);
}

