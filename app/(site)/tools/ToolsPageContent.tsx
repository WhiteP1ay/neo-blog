'use client';

import { features } from './features';
import { FeatureCard } from './FeatureCard';

interface ToolsPageContentProps {
  variant?: 'page' | 'modal';
}

export function ToolsPageContent({ variant = 'page' }: ToolsPageContentProps) {
  const isModal = variant === 'modal';

  return (
    <section className={isModal ? 'py-4' : ''}>
      <header className={isModal ? 'mb-4' : 'mb-6'}>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">工具与资源</h1>
      </header>
      <ul className="m-0 list-none p-0 space-y-3">
        {features.map((feature) => (
          <li key={feature.id}>
            <FeatureCard feature={feature} />
          </li>
        ))}
      </ul>
    </section>
  );
}
