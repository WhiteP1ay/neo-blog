import * as cheerio from 'cheerio';
import type { BundledLanguage } from 'shiki';
import { shikiHighlighterReady } from '@/server/utils/shiki-highlighter';

/** 与正文 prose 排版协调：not-prose 会丢掉 typography 的 pre 外边距，故用 my-* 显式留白 */
const PRE_LAYOUT_CLASS = 'not-prose relative my-6 overflow-x-auto rounded-lg border border-border/60 sm:my-8';

/** marked 常用 language-xxx / TipTap 等可能用 lang-xxx */
const LANG_CLASS_RE = /(?:^|\s)(?:language|lang)-([\w-+]+)/;

/** 别名 → shiki bundled id */
const LANG_ALIASES: Record<string, BundledLanguage> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  py: 'python',
  rs: 'rust',
  rb: 'ruby',
  kt: 'kotlin',
  fs: 'fsharp',
  cs: 'csharp',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cxx: 'cpp',
  shell: 'bash',
};

function inferLang(classAttr: string | undefined): BundledLanguage {
  if (!classAttr?.trim()) {
    return 'markdown';
  }
  const m = classAttr.match(LANG_CLASS_RE);
  const raw = (m?.[1] ?? '').toLowerCase();
  if (!raw) {
    return 'markdown';
  }
  const mapped = LANG_ALIASES[raw] ?? (raw as BundledLanguage);
  return mapped;
}

/**
 * 将 HTML 中「未高亮」的 pre>code 转为 Shiki 双主题 HTML（浅色/深色由 CSS 变量切换）。
 * 已含 .shiki 或 code 内已有 span（如旧 hljs）则跳过，避免破坏编辑器回写或二次嵌套。
 */
export async function highlightCodeBlocksInHtml(html: string): Promise<string> {
  if (!html.includes('<pre') || !html.includes('<code')) {
    return html;
  }

  const highlighter = await shikiHighlighterReady;
  const $ = cheerio.load(html);
  const pres = $('pre').toArray();

  for (const preEl of pres) {
    const pre = $(preEl);
    if (pre.hasClass('shiki')) {
      continue;
    }

    const code = pre.find('code').first();
    if (!code.length) {
      continue;
    }

    if (code.find('span').length > 0) {
      continue;
    }

    const text = code.text();
    if (!text.trim()) {
      continue;
    }

    const lang = inferLang(code.attr('class'));
    const themes = { light: 'catppuccin-latte' as const, dark: 'catppuccin-mocha' as const };

    let out: string;
    try {
      out = await highlighter.codeToHtml(text, {
        lang,
        themes,
        defaultColor: false,
      });
    } catch {
      try {
        out = await highlighter.codeToHtml(text, {
          lang: 'markdown',
          themes,
          defaultColor: false,
        });
      } catch {
        continue;
      }
    }

    const $wrap = cheerio.load(out);
    const newPre = $wrap('pre').first();
    newPre.addClass(PRE_LAYOUT_CLASS);
    const serialized = $wrap.html(newPre);
    if (serialized) {
      pre.replaceWith(serialized);
    }
  }

  return $('body').html() ?? html;
}
