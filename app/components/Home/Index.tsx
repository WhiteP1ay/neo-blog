'use client';

import { useState } from 'react';
import { FeatureCardList } from './FeatureCardList';
import { ConsultPopup } from './ConsultPopup';
import { Main } from './Main';
import { Footer } from './Footer';

export function HomePageContent() {
  const [showConsultPopup, setShowConsultPopup] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* 英雄区域 */}
      <Main />

      {/* 功能区块 */}
      <FeatureCardList onConsultClick={() => setShowConsultPopup(true)} />

      {/* 底部区域 */}
      <Footer />

      {/* 付费咨询弹窗 */}
      <ConsultPopup isOpen={showConsultPopup} onClose={() => setShowConsultPopup(false)} />
    </div>
  );
}
