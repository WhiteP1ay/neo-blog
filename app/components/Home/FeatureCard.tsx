'use client';

import Link from 'next/link';
import type { Feature } from '@/app/features';

interface FeatureCardProps {
  feature: Feature;
  onConsultClick?: () => void;
}

export function FeatureCard({ feature, onConsultClick }: FeatureCardProps) {
  return (
    <div
      key={feature.id}
      className="group border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
          {feature.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
      </div>
      <button
        onClick={() => {
          if (feature.isPopup && onConsultClick) {
            onConsultClick();
          }
        }}
        className={`text-sm font-medium flex items-center gap-2 ${feature.isPopup ? 'cursor-pointer' : ''}`}
      >
        {!feature.isPopup ? (
          <Link href={feature.href} className="group-hover:underline">
            了解更多
          </Link>
        ) : (
          <span className="group-hover:underline">立即咨询</span>
        )}
      </button>
    </div>
  );
}
