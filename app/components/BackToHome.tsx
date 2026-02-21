import Link from 'next/link';

interface BackToHomeProps {
  /**
   * 是否显示图标
   * @default true
   */
  showIcon?: boolean;
  /**
   * 自定义样式类名
   */
  className?: string;
  /**
   * 点击时的回调
   */
  onClick?: () => void;
  /**
   * 显示的文字
   * @default "返回首页"
   */
  label?: string;
}

/**
 * 返回首页组件（可复用）
 */
export function BackToHome({ showIcon = true, className, onClick, label = '返回首页' }: BackToHomeProps) {
  const defaultClassName = showIcon
    ? 'inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors'
    : 'text-sm text-gray-600 hover:text-gray-900';

  return (
    <Link href="/" className={className || defaultClassName} onClick={onClick}>
      {showIcon && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      )}
      <span>{label}</span>
    </Link>
  );
}
