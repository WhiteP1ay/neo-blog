/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为中文格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串，例如：2024年1月1日
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 格式化日期为简短格式（仅日期）
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串，例如：2024/1/1
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.toLocaleDateString("zh-CN");
}

