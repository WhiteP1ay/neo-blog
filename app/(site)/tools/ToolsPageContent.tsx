'use client';

import { features } from './features';
import { FeatureCard } from './FeatureCard';

interface ToolsPageContentProps {
  variant?: 'page' | 'modal';
}

export function ToolsPageContent({ variant = 'page' }: ToolsPageContentProps) {
  const isModal = variant === 'modal';

  return (
    <section className={isModal ? 'px-2 py-4 sm:px-4 sm:py-6' : 'px-4 py-12 sm:py-16'}>
      <div className="mx-auto max-w-5xl">
        <div className={isModal ? 'mb-6' : 'mb-10'}>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">工具与资源</h1>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
            />
          ))}
        </div>
      </div>
    </section>


  );
}
