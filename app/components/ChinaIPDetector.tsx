"use client";

import { useState, useEffect } from "react";

/**
 * 检测用户是否在中国大陆
 * 通过尝试访问Google来判断（Google在中国被墙）
 */
export function useChinaIPDetector() {
  const [isChina, setIsChina] = useState<boolean | null>(null); // null表示检测中
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let img: HTMLImageElement | null = null;

    /**
     * 通过尝试加载Google的favicon来判断是否在中国大陆
     * Google在中国被墙，如果能加载说明不在中国大陆
     */
    const checkGoogle = () => {
      return new Promise<boolean>((resolve) => {
        img = new Image();
        let resolved = false;

        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            if (img) {
              img.onload = null;
              img.onerror = null;
              img = null;
            }
          }
        };

        // 设置超时（3秒）
        timeoutId = setTimeout(() => {
          cleanup();
          resolve(true); // 超时认为在中国大陆
        }, 3000);

        img.onload = () => {
          cleanup();
          resolve(false); // 能加载，不在中国大陆
        };

        img.onerror = () => {
          cleanup();
          resolve(true); // 加载失败，可能在中国大陆
        };

        // 尝试加载 Google 的 favicon，添加时间戳避免缓存
        img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;
      });
    };

    const checkLocation = async () => {
      const result = await checkGoogle();
      
      if (isMounted) {
        setIsChina(result);
        setIsChecking(false);
      }
    };

    checkLocation();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (img) {
        img.onload = null;
        img.onerror = null;
        img = null;
      }
    };
  }, []);

  return { isChina, isChecking };
}

