/**
 * Home Explorer（首页三栏）布局常量。
 *
 * 说明：
 * - 这里仅放“常量”，不放工具函数与类型
 * - 保持与 store/hook 使用方式一致，避免出现多个来源的默认值
 */

/** localStorage 持久化 key（布局相关） */
export const HOME_EXPLORER_LAYOUT_STORAGE_KEY = 'neo-blog-home-explorer-layout';

/** 默认/边界：专题栏宽度（px） */
export const DEFAULT_SIDEBAR_PX = 216;
export const MAX_SIDEBAR_PX = 400;
export const MIN_SIDEBAR_PX = 140;

/** 默认/边界：文章列表宽度（px） */
export const DEFAULT_LIST_PX = 288;
export const MAX_LIST_PX = 560;
export const MIN_LIST_PX = 200;

/** 专题栏收起后仅保留的窄轨宽度（用于分栏按钮） */
export const TOPIC_RAIL_PX = 48;

