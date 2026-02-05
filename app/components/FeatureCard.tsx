import Link from "next/link";

interface FeatureCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * 专题/工具入口卡片组件
 */
export function FeatureCard({ href, icon, title, description }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-md bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600">
            {description}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 mt-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

