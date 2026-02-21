// 定义功能区块数据结构
export interface Feature {
  id: string;
  title: string;
  description: string;
  href: string;
  isPopup?: boolean;
}

export const features: Feature[] = [
  {
    id: "blog",
    title: "技术博客",
    description: "浏览精选技术文章和编程分享",
    href: "/blog",
  },
  {
    id: "resume",
    title: "简历编辑器",
    description: "创建专业的技术简历",
    href: "/resume",
  },
  // {
  //   id: "interview",
  //   title: "面试题库",
  //   description: "准备前端技术面试",
  //   href: "/interview-questions",
  // },
  // {
  //   id: "animation",
  //   title: "动画工具",
  //   description: "导出和分享动画效果",
  //   href: "/animation-exporter",
  // },
  {
    id: "consult",
    title: "付费咨询",
    description: "获取一对一技术咨询",
    href: "#",
    isPopup: true,
  },
];
