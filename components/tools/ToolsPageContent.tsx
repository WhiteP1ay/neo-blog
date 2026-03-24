'use client';

import { useState } from 'react';
import { features } from '@/app/features';
import { ConsultPopup } from '@/components/Home/ConsultPopup';
import { FeatureCard } from '@/components/Home/FeatureCard';

interface ToolsPageContentProps {
  /** 弹窗内使用更紧凑的边距 */
  variant?: 'page' | 'modal';
}

/**
 * /tools 页面：功能卡片网格 + 付费咨询弹窗
 */
export function ToolsPageContent({ variant = 'page' }: ToolsPageContentProps) {
  const [showConsultPopup, setShowConsultPopup] = useState(false);
  const isModal = variant === 'modal';

  return (
    <>
      <section className={isModal ? 'px-2 py-4 sm:px-4 sm:py-6' : 'px-4 py-12 sm:py-16'}>
        <div className="mx-auto max-w-5xl">
          <div className={isModal ? 'mb-6' : 'mb-10'}>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">工具与资源</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
              博客、简历编辑与付费咨询等入口，与首页卡片布局一致。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onConsultClick={feature.isPopup ? () => setShowConsultPopup(true) : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <ConsultPopup
        isOpen={showConsultPopup}
        onClose={() => setShowConsultPopup(false)}
        onConsult={() => {
          window.open('https://message.bilibili.com/#/whisper/mid107889531');
        }}
      />
    </>
  );
}
