'use client';

import Link from 'next/link';
import type { Feature } from '@/app/(site)/tools/features';

interface FeatureCardProps {
  feature: Feature;

}


export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link href={feature.href} className="font-medium">
          {feature.title}
        </Link>
        <Link href={feature.href} className="text-xs">
          了解更多 →
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/80">{feature.description}</p>
    </div>
  );
}
