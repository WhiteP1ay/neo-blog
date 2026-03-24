export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  content: string; // HTML 内容
}
