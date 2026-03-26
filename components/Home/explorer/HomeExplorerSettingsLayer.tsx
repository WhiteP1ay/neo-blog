'use client';

/**
 * 设置层遮罩 + 容器：根据 layout store 的 settingsOpen 控制显示。
 */

import { HomeWindowSettings } from './HomeWindowSettings';
import { useHomeExplorerLayoutStore } from '../store/home-explorer-layout-store';

type HomeExplorerSettingsLayerProps = {
  isAdminLoggedIn: boolean;
};

export function HomeExplorerSettingsLayer({ isAdminLoggedIn }: HomeExplorerSettingsLayerProps) {
  const open = useHomeExplorerLayoutStore((s) => s.settingsOpen);
  const close = useHomeExplorerLayoutStore((s) => s.closeSettings);

  if (!open) {
    return null;
  }
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-5">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="关闭设置"
        onClick={close}
      />
      <div
        className="border-border bg-card relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-settings-title"
      >
        <HomeWindowSettings onClose={close} isAdminLoggedIn={isAdminLoggedIn} />
      </div>
    </div>
  );
}

