'use client';

import { useEffect } from 'react';

const BTN_CLASS =
  'hljs-copy-button pointer-events-auto absolute right-2 top-2 z-10 rounded-md border border-border/70 bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/**
 * 为 .prose 内代码块挂复制按钮（高亮由服务端 Shiki 完成，此处不再跑 highlight.js）
 */
function attachCopyButton(pre: HTMLPreElement) {
  pre.querySelectorAll('.hljs-copy-button').forEach((n) => {
    n.remove();
  });

  const code = pre.querySelector('code');
  if (!code) {
    return;
  }

  if (!pre.classList.contains('relative')) {
    pre.classList.add('relative');
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = BTN_CLASS;
  btn.textContent = '复制';
  btn.setAttribute('aria-label', '复制代码');

  btn.addEventListener('click', async () => {
    const text = code.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '已复制';
      window.setTimeout(() => {
        btn.textContent = '复制';
      }, 2000);
    } catch {
      btn.textContent = '失败';
      window.setTimeout(() => {
        btn.textContent = '复制';
      }, 2000);
    }
  });

  pre.appendChild(btn);
}

/**
 * @param contentKey 文章或正文变化时重新扫描（如首页同 id 换内容、路由切换）
 */
export function CodeBlockCopyButtons({ contentKey }: { contentKey?: string | number }) {
  useEffect(() => {
    void contentKey;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
          attachCopyButton(pre);
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [contentKey]);

  return null;
}
