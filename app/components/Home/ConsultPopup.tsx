'use client';

import { Button } from '../ui/Button';

interface ConsultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConsult: () => void;
}

export function ConsultPopup({ isOpen, onClose, onConsult }: ConsultPopupProps) {
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
          <p className="text-lg">
            服务流程：
          </p>
          <ul>
            <li className="mb-2">1. B站私信我你的问题或需求</li>
            <li className="mb-2">2. 协商确认时间和价格</li>
            <li className="mb-2">3. 安排咨询会议，定制服务与方案</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            - 最晚次日中午十二点回复私信
            <br />
            - 业务涵盖：付费咨询/模拟面试及总结/简历修改建议/代码review/面试题解答/课程设计咨询与技术服务
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            关闭
          </Button>
          <Button className="ml-2" variant="primary" size="md" onClick={onConsult}>
            咨询
          </Button>
        </div>
      </div>
    </div>
  );
}
