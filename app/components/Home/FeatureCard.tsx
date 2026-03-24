'use client';

import Link from 'next/link';
import type { Feature } from '@/app/features';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';

interface FeatureCardProps {
  feature: Feature;
  onConsultClick?: () => void;
}

/**
 * 工具/功能卡片（与首页历史样式一致，shadcn Card）
 */
export function FeatureCard({ feature, onConsultClick }: FeatureCardProps) {
  return (
    <Card className="group border-border transition-colors hover:border-primary/35">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-medium transition-colors group-hover:text-primary">
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
      </CardContent>
      <CardFooter className="pt-2">
        {feature.isPopup ? (
          <Button variant="link" className="h-auto p-0 text-primary" onClick={() => onConsultClick?.()}>
            立即咨询 →
          </Button>
        ) : (
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href={feature.href} className="text-primary">
              了解更多 →
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
