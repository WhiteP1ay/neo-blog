'use client';

import { useEffect } from 'react';

const BTN_CLASS =
  'hljs-copy-button cursor-pointer pointer-events-auto absolute right-2 top-2 z-10 rounded-md';

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

export function CodeBlockCopyButtons({ contentKey }: { contentKey?: string | number }) {
  useEffect(() => {
    //读取一下然后丢弃结果,用于消除未使用变量的警告，或明确表示故意不使用它
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
