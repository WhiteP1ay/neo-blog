'use client';

/**
 * 设置层遮罩 + 容器：根据 layout store 的 settingsOpen 控制显示。
 */

import { WindowSettings } from './WindowSettings';
import { useLayoutStore } from '../store/layout';

export type ExplorerSettingsLayerProps = {
  isAdminLoggedIn: boolean;
};

export function ExplorerSettingsLayer({ isAdminLoggedIn }: ExplorerSettingsLayerProps) {
  const open = useLayoutStore((s) => s.settingsOpen);
  const close = useLayoutStore((s) => s.closeSettings);

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
        <WindowSettings onClose={close} isAdminLoggedIn={isAdminLoggedIn} />
      </div>
    </div>
  );
}

