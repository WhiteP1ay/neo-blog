import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names; later wins on conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
 * 格式化日期为简短格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串，例如：2024/1/1
 */
export function formatDateShort(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString("zh-CN");
}
