'use client';

import Link from 'next/link';
import type { Feature } from '@/app/(site)/tools/features';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  feature: Feature;

}


export function FeatureCard({ feature }: FeatureCardProps) {
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
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href={feature.href} className="text-primary">
            了解更多 →
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
