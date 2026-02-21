"use client";

import { Button } from "../ui/Button";

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
      <div
        className="bg-white dark:bg-gray-900 rounded-md shadow-lg max-w-md w-full p-8 border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-medium">
            付费咨询
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            付费咨询功能正在开发中，敬请期待！
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            后续将提供一对一技术咨询服务，包括前端开发、后端开发、面试指导等。
          </p>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="md"
            onClick={onClose}
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}