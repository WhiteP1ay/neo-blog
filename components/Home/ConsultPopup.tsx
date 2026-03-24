'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConsultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConsult: () => void;
}

export function ConsultPopup({ isOpen, onClose, onConsult }: ConsultPopupProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>付费咨询</DialogTitle>
        </DialogHeader>
        <div className="text-sm leading-relaxed">
          <p className="text-lg">服务流程：</p>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>1. B站私信我你的问题或需求</li>
            <li>2. 协商确认时间和价格</li>
            <li>3. 安排咨询会议，定制服务与方案</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-xs sm:text-sm">
            - 最晚次日中午十二点回复私信
            <br />- 业务涵盖：付费咨询/模拟面试及总结/简历修改建议/代码review/面试题解答/课程设计咨询与技术服务
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button type="button" onClick={onConsult}>
            咨询
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
