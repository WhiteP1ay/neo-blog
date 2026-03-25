'use client';

import type { ReactNode } from 'react';
import { SiteRedDotModal } from '@/components/SiteRedDotModal';
import type { SiteModalId } from '@/app/nav';
import { closeSiteModal, useSiteModalsStore } from '@/lib/site-modals-store';

const TITLES: Record<SiteModalId, string> = {
  tools: '工具与资源',
  about: '关于',
  privacy: '隐私政策',
};

/**
 * 根布局挂载：zustand 里的 active 驱动三个弹窗
 */
export function SiteModalsHost({
  aboutSlot,
  privacySlot,
  toolsSlot,
}: {
  aboutSlot: ReactNode;
  privacySlot: ReactNode;
  toolsSlot: ReactNode;
}) {
  const active = useSiteModalsStore((s) => s.active);

  const onOpenChange = (next: boolean) => {
    if (!next) {
      closeSiteModal();
    }
  };

  return (
    <>
      <SiteRedDotModal
        open={active === 'about'}
        onOpenChange={onOpenChange}
        title={TITLES.about}
        className="sm:max-w-3xl"
      >
        {aboutSlot}
      </SiteRedDotModal>
      <SiteRedDotModal
        open={active === 'privacy'}
        onOpenChange={onOpenChange}
        title={TITLES.privacy}
        className="sm:max-w-2xl"
      >
        {privacySlot}
      </SiteRedDotModal>
      <SiteRedDotModal
        open={active === 'tools'}
        onOpenChange={onOpenChange}
        title={TITLES.tools}
        headerVariant="traffic"
        className="sm:max-w-5xl"
      >
        {toolsSlot}
      </SiteRedDotModal>
    </>
  );
}
