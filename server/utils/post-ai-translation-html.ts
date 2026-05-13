import { load } from 'cheerio';

import { stripLeadingTypeLikePrefixes } from '@/lib/strip-post-title-prefixes';

const WRAP_ID = '__neo_blog_ai_wrap__';

/** 双语导航、H1 提示、英文区块（h2 及其后所有兄弟节点） */
export const BILINGUAL_NAV_ID = 'neo-blog-bilingual-nav';
export const H1_EN_HINT_ID = 'neo-blog-h1-en-hint';
export const EN_SECTION_H2_ID = 'post-english-section';
export const EN_SECTION_WRAP_ID = 'neo-blog-en-section-wrap';

function wrapHtml(html: string) {
  return `<div id="${WRAP_ID}">${html}</div>`;
}

function unwrapHtml($: ReturnType<typeof load>): string {
  const inner = $(`#${WRAP_ID}`).html();
  return inner ?? '';
}

/**
 * 移除此前「追加英文」插入的区块，得到仅中文部分（用于再次翻译或送模型）。
 */
export function stripTranslationArtifacts(html: string): string {
  if (!html) return html;
  const hasMarker =
    html.includes(BILINGUAL_NAV_ID) ||
    html.includes(H1_EN_HINT_ID) ||
    html.includes(EN_SECTION_H2_ID) ||
    html.includes(EN_SECTION_WRAP_ID);
  if (!hasMarker) return html;

  const $ = load(wrapHtml(html), null, false);
  const root = $(`#${WRAP_ID}`);
  root.find(`#${BILINGUAL_NAV_ID}`).remove();
  root.find(`#${H1_EN_HINT_ID}`).remove();
  root.find(`#${EN_SECTION_WRAP_ID}`).remove();
  return unwrapHtml($);
}

/**
 * 从仍嵌在中文正文里的旧版「英文包裹块」提取 HTML（去掉 h2「English」与首条 hr）。
 */
export function extractEnglishFragmentFromLegacyAppend(html: string): string | null {
  if (!html.includes(EN_SECTION_WRAP_ID)) return null;
  const $ = load(html, null, false);
  const wrap = $(`#${EN_SECTION_WRAP_ID}`).first();
  if (!wrap.length) return null;
  const clone = wrap.clone();
  clone.find(`#${EN_SECTION_H2_ID}`).remove();
  clone.find('hr').first().remove();
  const inner = clone.html()?.trim() ?? '';
  return inner.length > 0 ? inner : null;
}

/**
 * 在中文 HTML 上插入 H1 提示、标题下锚链、分隔线与英文区块。
 */
export function appendEnglishSection(chineseHtml: string, englishFragmentHtml: string): string {
  const $ = load(wrapHtml(chineseHtml), null, false);
  const root = $(`#${WRAP_ID}`);
  const h1 = root.find('h1').first();
  if (h1.length) {
    h1.append(
      `<span id="${H1_EN_HINT_ID}" class="not-prose text-muted-foreground font-normal">(English version below)</span>`,
    );
    h1.after(
      `<p id="${BILINGUAL_NAV_ID}" class="not-prose text-sm"><a href="#${EN_SECTION_H2_ID}">Jump to English section</a></p>`,
    );
  }
  root.append(
    `<div id="${EN_SECTION_WRAP_ID}"><hr class="my-8 border-border" /><h2 id="${EN_SECTION_H2_ID}">English</h2>${englishFragmentHtml}</div>`,
  );
  return unwrapHtml($);
}

/**
 * 将英文片段中可能出现的首个 h1 降级为段落标题，避免整页多个 h1。
 */
export function demoteLeadingH1InFragment(fragmentHtml: string): string {
  const trimmed = fragmentHtml.trim();
  if (!trimmed) return trimmed;
  const $ = load(wrapHtml(trimmed), null, false);
  const root = $(`#${WRAP_ID}`);
  const firstH1 = root.find('h1').first();
  if (firstH1.length) {
    const inner = firstH1.html() ?? '';
    firstH1.replaceWith(`<p class="text-2xl font-bold tracking-tight text-foreground">${inner}</p>`);
  }
  return unwrapHtml($);
}

/**
 * 从正文 HTML 取第一个 h1 的纯文本，用于同步 posts.title。
 */
export function extractFirstH1PlainText(html: string): string | null {
  if (!html.trim()) return null;
  const $ = load(wrapHtml(html), null, false);
  const h1 = $(`#${WRAP_ID} h1`).first();
  if (!h1.length) return null;
  h1.find(`#${H1_EN_HINT_ID}`).remove();
  const text = h1.text().replace(/\s+/g, ' ').trim();
  return text || null;
}

/**
 * 去掉正文 HTML 中**第一个** `h1` 可见文本开头的 `【…】`、`[…]` 装饰（与 {@link stripLeadingTypeLikePrefixes} 一致）。
 * 会暂时摘下 `#${H1_EN_HINT_ID}` 再计算纯文本，最后拼回，避免误伤「English below」提示。
 */
export function stripLeadingDecorationsFromFirstH1InHtml(html: string): string {
  if (!html?.trim()) return html;
  const $ = load(wrapHtml(html), null, false);
  const root = $(`#${WRAP_ID}`);
  const h1 = root.find('h1').first();
  if (!h1.length) return html;

  const hint = h1.find(`#${H1_EN_HINT_ID}`);
  const hintClone = hint.clone();
  hint.remove();
  const plain = h1.text().replace(/\s+/g, ' ').trim();
  if (!plain) {
    h1.append(hintClone);
    return unwrapHtml($);
  }
  const stripped = stripLeadingTypeLikePrefixes(plain);
  if (!stripped.length || stripped === plain) {
    h1.append(hintClone);
    return unwrapHtml($);
  }

  h1.empty();
  h1.text(stripped);
  h1.append(hintClone);
  return unwrapHtml($);
}
