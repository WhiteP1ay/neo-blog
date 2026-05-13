/**
 * 去掉标题/首行里常见的「伪类型」装饰前缀：从字符串开头反复移除 `【…】` 与 `[…]`（可跟空白）。
 * 用于历史数据清洗与保存时归一化，**不**从 H1 推断文章类型（类型由 `post_types` + `typeIds` 维护）。
 */
export function stripLeadingTypeLikePrefixes(raw: string): string {
  let s = raw.trim();
  let prev: string;
  do {
    prev = s;
    s = s.replace(/^【[^】]*】\s*/u, '');
    s = s.replace(/^\[[^\]]*\]\s*/, '');
  } while (s !== prev);
  return s;
}
