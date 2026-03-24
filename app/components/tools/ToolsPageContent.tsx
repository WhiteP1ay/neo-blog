'use client';

import { useState } from 'react';
import { features } from '@/app/features';
import { ConsultPopup } from '@/app/components/Home/ConsultPopup';
import { FeatureCard } from '@/app/components/Home/FeatureCard';

/**
 * /tools 页面：功能卡片网格 + 付费咨询弹窗
 */
export function ToolsPageContent() {
  const [showConsultPopup, setShowConsultPopup] = useState(false);

  return (
    <>
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">工具与资源</h1>
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
