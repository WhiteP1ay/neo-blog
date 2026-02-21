'use client';

import { useState, useEffect } from 'react';

export function TypewriterText() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0); // 0: 打字中, 1: 完成, 2: 等待
  const [currentIndex, setCurrentIndex] = useState(0);

  const fullText = 'WhiteMeta';
  const domainText = '.cn';
  const typingSpeed = 150; // 打字速度（毫秒/字符）
  const pauseDuration = 8000; // 完成后的暂停时间（毫秒）

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (phase === 0) {
      if (currentIndex < fullText.length) {
        // 打字阶段
        timeoutId = setTimeout(() => {
          setText(fullText.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, typingSpeed);
      } else {
        // 完成第一阶段，开始第二阶段
        setPhase(1);
      }
    } else if (phase === 1) {
      // 添加域名部分
      if (currentIndex < fullText.length + domainText.length) {
        timeoutId = setTimeout(() => {
          const domainIndex = currentIndex - fullText.length;
          setText(fullText + domainText.substring(0, domainIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, typingSpeed);
      } else {
        // 完成第二阶段，开始暂停
        setPhase(2);
      }
    } else if (phase === 2) {
      // 暂停后重置
      timeoutId = setTimeout(() => {
        setText('');
        setCurrentIndex(0);
        setPhase(0);
      }, pauseDuration);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [phase, currentIndex]);

  return (
    <span className="inline-block">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
}
