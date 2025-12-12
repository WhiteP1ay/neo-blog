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

    /**
     * 尝试访问Google的favicon（小文件，快速）
     * 如果能够访问，说明不在中国大陆
     */
    const checkGoogle = async () => {
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 2500); // 2.5秒超时

      try {
        await fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          mode: "no-cors", // 避免CORS问题
          signal: controller.signal,
          cache: "no-cache",
        });
        // 能够访问Google，不在中国大陆
        if (isMounted) {
          setIsChina(false);
          setIsChecking(false);
        }
      } catch {
        // 无法访问Google，可能在中国大陆
        // 但也要考虑网络问题，所以再尝试一个备用检测
        if (isMounted) {
          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => {
              controller2.abort();
            }, 2500);
            
            await fetch("https://github.com/favicon.ico", {
              method: "HEAD",
              mode: "no-cors",
              signal: controller2.signal,
              cache: "no-cache",
            });
            // 能访问GitHub，可能不在中国大陆
            if (isMounted) {
              setIsChina(false);
              setIsChecking(false);
            }
            clearTimeout(timeoutId2);
          } catch {
            // 两个都访问不了，很可能在中国大陆
            if (isMounted) {
              setIsChina(true);
              setIsChecking(false);
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkGoogle();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return { isChina, isChecking };
}

