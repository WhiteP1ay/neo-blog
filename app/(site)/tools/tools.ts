// 定义功能区块数据结构
export interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  isPopup?: boolean;
}

export const tools: Tool[] = [
  {
    id: "resume",
    title: "简历编辑器",
    description: "创建专业的技术简历",
    href: "/resume",
  },
];
