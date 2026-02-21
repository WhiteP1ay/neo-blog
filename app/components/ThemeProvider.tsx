'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // 服务器端渲染时始终返回 false（亮色模式）
    // 客户端渲染时从本地存储读取主题偏好
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // 默认根据系统偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 客户端渲染时，在组件挂载后检查并更新主题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      let initialDarkMode = false;

      if (savedTheme) {
        initialDarkMode = savedTheme === 'dark';
      } else {
        initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      // 如果主题与服务器端渲染的不一致，更新主题
      if (initialDarkMode !== isDarkMode) {
        setIsDarkMode(initialDarkMode);
        if (initialDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    // 直接更新文档根元素的 class
    if (newIsDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // 保存到本地存储
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
  };

  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>;
}
