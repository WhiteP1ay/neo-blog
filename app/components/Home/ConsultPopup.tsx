'use client';

import { Button } from '../ui/Button';

interface ConsultPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConsultPopup({ isOpen, onClose }: ConsultPopupProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-md shadow-lg max-w-md w-full p-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-medium">付费咨询</h3>
        </div>
        <div className="mb-8">
          <ul>
            <li className="mb-2">1. B站私信我，直接发送你的问题或需求。</li>
            <li className="mb-2">2. 我根据你的问题，在最短时间内给你答复。并协商时间和价格。</li>
            <li className="mb-2">3. 付费并建立语音通话</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
