

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}

/**
 * 主题切换开关组件
 * 带有太阳/月亮图标，支持平滑过渡动画
 */
export function Switch({ checked, onChange, ariaLabel }: SwitchProps) {
  return (
    <div className={`flex items-center gap-3 justify-end `}>

      <button
        onClick={onChange}
        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 cursor-pointer"
        aria-label={ariaLabel || (checked ? "启用亮色模式" : "启用暗色模式")}
        role="switch"
        aria-checked={checked}
      >
        {/* 背景圆圈 */}
        <span className={`absolute inset-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />

        {/* 滑块 */}
        <span className={`relative inline-block h-5 w-5 transform rounded-full transition-transform ${checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-gray-300'}`}>
          {/* 图标容器 */}
          <span className="absolute inset-0 flex items-center justify-center">
            {!checked ? (
              /* 太阳图标 (亮色模式) */
              <svg
                className="w-3 h-3 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              /* 月亮图标 (暗色模式) */
              <svg
                className="w-3 h-3 text-yellow-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                />
              </svg>
            )}
          </span>
        </span>
      </button>
    </div>
  );
}
