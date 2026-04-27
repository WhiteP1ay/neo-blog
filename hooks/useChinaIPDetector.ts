'use client';

import { useEffect, useState } from 'react';

export function useChinaIPDetector() {
  const [isChina, setIsChina] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    let img: HTMLImageElement | null = new Image();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: boolean) => {
      if (cancelled) return;
      setIsChina(result);
    };

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (img) {
        img.onload = null;
        img.onerror = null;
        img = null;
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      finish(true); // timeout => assume CN
    }, 3000);

    img.onload = () => {
      cleanup();
      finish(false);
    };
    img.onerror = () => {
      cleanup();
      finish(true);
    };

    // avoid cache
    img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return { isChina, isChecking: isChina === null };
}

