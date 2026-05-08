'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { setBlockType } from '@tiptap/pm/commands';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import { common, createLowlight } from 'lowlight';
import {
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Bold,
  ChevronDown,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Quote,
  Rows3,
  Columns3,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from '@tiptap/pm/view';
import { useToast } from '@/components/Toast';

const lowlight = createLowlight(common);
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/g;
const SINGLE_MARKDOWN_IMAGE_PATTERN = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

/**
 * 文字高亮预设色板。颜色都是浅色 pastel，在浅色与深色主题下可读性都尚可。
 * 第一项作为「未指定颜色」时的默认 fallback。
 */
const HIGHLIGHT_PRESETS: Array<{ key: string; color: string; label: string }> = [
  { key: 'yellow', color: '#fef08a', label: '黄' },
  { key: 'green', color: '#bbf7d0', label: '绿' },
  { key: 'blue', color: '#bfdbfe', label: '蓝' },
  { key: 'pink', color: '#fbcfe8', label: '粉' },
  { key: 'purple', color: '#ddd6fe', label: '紫' },
  { key: 'orange', color: '#fed7aa', label: '橙' },
];
const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].color;

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  toolbarRight?: ReactNode;
};

/**
 * 轻量富文本编辑器，供 admin 博文编辑复用。
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容',
  minHeightClassName = 'min-h-48',
  toolbarRight,
}: RichTextEditorProps) {
  const { showToast } = useToast();
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [selectedImageMarkdown, setSelectedImageMarkdown] = useState('');
  const [highlightPaletteOpen, setHighlightPaletteOpen] = useState(false);
  // 用 state 让色板按钮上的小色块可以响应颜色切换；ref 给扩展的 keyboard handler 读取最新值（避免闭包陈旧）。
  const [lastHighlightColor, setLastHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const lastHighlightColorRef = useRef<string>(DEFAULT_HIGHLIGHT_COLOR);
  useEffect(() => {
    lastHighlightColorRef.current = lastHighlightColor;
  }, [lastHighlightColor]);

  /**
   * 自定义 Highlight 扩展：保留 multicolor 能力，并把 Mod-Shift-H 改为「用最近一次颜色 toggle」。
   */
  const HighlightExtension = useMemo(
    () =>
      Highlight.extend({
        addKeyboardShortcuts() {
          return {
            'Mod-Shift-h': () => {
              const color = lastHighlightColorRef.current || DEFAULT_HIGHLIGHT_COLOR;
              return this.editor.chain().focus().toggleHighlight({ color }).run();
            },
          };
        },
      }).configure({
        multicolor: true,
        HTMLAttributes: { class: 'rt-highlight' },
      }),
    [],
  );

  /**
   * 将粘贴文本中的 Markdown 图片语法转换为图片节点，确保粘贴后立即所见即所得。
   */
  const insertMarkdownImageSyntax = useCallback((view: EditorView, plainText: string): boolean => {
    const matches = Array.from(plainText.matchAll(MARKDOWN_IMAGE_PATTERN));
    if (matches.length === 0) return false;
    const normalizedText = plainText.trim();
    if (!normalizedText) return false;
    const reconstructed = matches.map((item) => item[0]).join('\n');
    // 仅在纯图片语法粘贴时进行接管，避免误伤普通文本。
    if (normalizedText !== reconstructed) return false;

    const imageType = view.state.schema.nodes.image;
    if (!imageType) return false;

    const nodes = matches.map((item) =>
      imageType.create({
        src: item[2],
        alt: (item[1] ?? '').trim(),
        title: (item[3] ?? item[1] ?? '').trim() || null,
      }),
    );
    if (nodes.length === 0) return false;

    const paragraphType = view.state.schema.nodes.paragraph;
    const { from, to } = view.state.selection;
    let tr = view.state.tr.delete(from, to);
    let cursor = from;
    for (const node of nodes) {
      tr = tr.insert(cursor, node);
      cursor += node.nodeSize;
      if (paragraphType) {
        const paragraph = paragraphType.create();
        tr = tr.insert(cursor, paragraph);
        cursor += paragraph.nodeSize;
      }
    }
    view.dispatch(tr.scrollIntoView());
    return true;
  }, []);

  /**
   * 上传图片到 OSS（不入库），返回可访问 URL。
   */
  const uploadImageToOss = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as { data?: { url?: string }; error?: string };
      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.error ?? '图片上传失败');
      }
      return payload.data.url;
    },
    [],
  );

  /**
   * 粘贴/拖拽图片后异步上传并插入图片节点，同时复制 markdown 语法便于外部复用。
   */
  const handleImageInput = useCallback(
    async (file: File, insertAt: (payload: { url: string; alt: string }) => void) => {
      showToast(`开始上传图片：${file.name}`, 'info');
      try {
        const url = await uploadImageToOss(file);
        const alt = file.name.replace(/\.[^.]+$/i, '').trim() || 'image';
        const markdownText = `![${alt}](${url})`;
        // 编辑器内直接插入图片节点，保证所见即所得与持久化 HTML 一致。
        insertAt({ url, alt });
        await navigator.clipboard.writeText(markdownText);
        showToast('图片已上传，Markdown 链接已复制到剪贴板', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : '图片上传失败', 'error');
      }
    },
    [showToast, uploadImageToOss],
  );

  /**
   * 生成图片节点对应的 Markdown 语法，方便用户在选中图片时直接编辑。
   */
  const buildImageMarkdown = useCallback((attrs: { src?: unknown; alt?: unknown; title?: unknown }): string => {
    const src = typeof attrs.src === 'string' ? attrs.src.trim() : '';
    const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
    const title = typeof attrs.title === 'string' ? attrs.title.trim() : '';
    if (!src) return '';
    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  }, []);

  /**
   * 解析用户在“图片 Markdown 编辑条”里输入的语法。
   */
  const parseImageMarkdown = useCallback((markdown: string): { src: string; alt: string; title: string | null } | null => {
    const match = markdown.trim().match(SINGLE_MARKDOWN_IMAGE_PATTERN);
    if (!match) return null;
    return {
      alt: (match[1] ?? '').trim(),
      src: (match[2] ?? '').trim(),
      title: (match[3] ?? '').trim() || null,
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      // multicolor=true 让 mark 节点带 data-color，可保存任意背景色；
      // 自定义快捷键 Mod-Shift-H 复用最近一次选过的颜色（默认黄）。
      HighlightExtension,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none rounded border bg-background p-3 text-foreground focus:outline-none ${minHeightClassName}`,
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          const { state, dispatch } = view;
          const tr = state.tr.insertText('\t', state.selection.from, state.selection.to);
          dispatch(tr.scrollIntoView());
          return true;
        }
        if (event.key !== 'Enter') return false;
        const { state } = view;
        const { selection } = state;
        if (!selection.empty) return false;
        const lineStart = selection.$from.start();
        const currentLineText = state.doc.textBetween(lineStart, selection.from, '\n', '\n').trim();
        const fencedCodeMatch = currentLineText.match(/^```([\w-]+)?$/);
        if (!fencedCodeMatch) return false;
        const fenceLang = fencedCodeMatch[1]?.trim().toLowerCase() || null;
        const codeBlockType = view.state.schema.nodes.codeBlock;
        if (!codeBlockType) return false;
        event.preventDefault();
        // 先把围栏文本（```ts）从段落里清空，再用 setBlockType 把当前段落原地转成 codeBlock，
        // 这样 ProseMirror 会保持光标在原文本位置（即新代码块内部），后续粘贴落点正确。
        const tr = state.tr.delete(lineStart, selection.from);
        view.dispatch(tr);
        setBlockType(codeBlockType, { language: fenceLang })(view.state, view.dispatch);
        view.focus();
        return true;
      },
      handlePaste: (view, event) => {
        const plainText = event.clipboardData?.getData('text/plain') ?? '';
        if (plainText && insertMarkdownImageSyntax(view, plainText)) {
          event.preventDefault();
          return true;
        }
        const items = event.clipboardData?.items;
        if (!items) return false;
        const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        void handleImageInput(file, ({ url, alt }) => {
          const { state, dispatch } = view;
          const imageType = state.schema.nodes.image;
          if (!imageType) return;
          const imageNode = imageType.create({ src: url, alt, title: alt });
          dispatch(state.tr.replaceSelectionWith(imageNode).scrollIntoView());
        });
        return true;
      },
      handleClickOn: (view, _pos, node, nodePos) => {
        // 点击图片时强制切换为 NodeSelection，保证“图片 Markdown 编辑条”稳定出现。
        if (node.type.name !== 'image') return false;
        const nextSelection = NodeSelection.create(view.state.doc, nodePos);
        view.dispatch(view.state.tr.setSelection(nextSelection).scrollIntoView());
        return true;
      },
      handleClick: (view, pos) => {
        // 某些浏览器/节点结构下不会触发 handleClickOn，兜底用 pos 直接命中或回退一位识别图片。
        const directNode = view.state.doc.nodeAt(pos);
        if (directNode?.type.name === 'image') {
          const nextSelection = NodeSelection.create(view.state.doc, pos);
          view.dispatch(view.state.tr.setSelection(nextSelection).scrollIntoView());
          return true;
        }
        const prevPos = Math.max(0, pos - 1);
        const prevNode = view.state.doc.nodeAt(prevPos);
        if (prevNode?.type.name === 'image') {
          const nextSelection = NodeSelection.create(view.state.doc, prevPos);
          view.dispatch(view.state.tr.setSelection(nextSelection).scrollIntoView());
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
        if (!imageFile) return false;
        event.preventDefault();
        void handleImageInput(imageFile, ({ url, alt }) => {
          const { state, dispatch } = view;
          const imageType = state.schema.nodes.image;
          if (!imageType) return;
          const imageNode = imageType.create({ src: url, alt, title: alt });
          dispatch(state.tr.replaceSelectionWith(imageNode).scrollIntoView());
        });
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== value) {
      // 外部值变化时同步回编辑器，但避免触发二次 onUpdate。
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const resolveSelectedImage = (): { pos: number; node: ProseMirrorNode } | null => {
      const { selection } = editor.state;
      if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
        return { pos: selection.from, node: selection.node };
      }

      const afterNode = selection.$from.nodeAfter;
      if (afterNode?.type.name === 'image') {
        return { pos: selection.$from.pos, node: afterNode };
      }

      const beforeNode = selection.$from.nodeBefore;
      if (beforeNode?.type.name === 'image') {
        return { pos: selection.$from.pos - beforeNode.nodeSize, node: beforeNode };
      }

      // 光标在段落内时，兜底识别“段落里唯一图片”场景。
      const parentNode = selection.$from.parent;
      if (parentNode.childCount === 1) {
        const onlyChild = parentNode.firstChild;
        if (onlyChild?.type.name === 'image') {
          return { pos: selection.$from.start(), node: onlyChild };
        }
      }

      return null;
    };

    const syncSelectedImage = () => {
      const selectedImage = resolveSelectedImage();
      if (selectedImage) {
        setSelectedImagePos(selectedImage.pos);
        setSelectedImageMarkdown(buildImageMarkdown(selectedImage.node.attrs));
        return;
      }
      setSelectedImagePos(null);
      setSelectedImageMarkdown('');
    };

    syncSelectedImage();
    editor.on('selectionUpdate', syncSelectedImage);
    editor.on('update', syncSelectedImage);
    return () => {
      editor.off('selectionUpdate', syncSelectedImage);
      editor.off('update', syncSelectedImage);
    };
  }, [buildImageMarkdown, editor]);

  /**
   * 将编辑条中的 Markdown 同步回当前选中图片节点。
   */
  const applySelectedImageMarkdown = useCallback(() => {
    if (!editor || selectedImagePos === null) return;
    const parsed = parseImageMarkdown(selectedImageMarkdown);
    if (!parsed) {
      showToast('图片语法无效，请使用 ![alt](url) 或 ![alt](url "title")', 'error');
      return;
    }
    const currentNode = editor.state.doc.nodeAt(selectedImagePos);
    if (!currentNode || currentNode.type.name !== 'image') {
      showToast('当前未选中图片，请重新选中后再修改', 'error');
      return;
    }
    const tr = editor.state.tr.setNodeMarkup(selectedImagePos, undefined, {
      ...currentNode.attrs,
      src: parsed.src,
      alt: parsed.alt,
      title: parsed.title,
    });
    editor.view.dispatch(tr.scrollIntoView());
    editor.commands.focus();
    showToast('图片已更新', 'success');
  }, [editor, parseImageMarkdown, selectedImageMarkdown, selectedImagePos, showToast]);

  if (!editor) {
    return <div className={`rounded border p-3 text-sm text-muted-foreground ${minHeightClassName}`}>{placeholder}</div>;
  }

  /**
   * 根据当前光标位置推导块级格式，供下拉框展示当前状态。
   */
  const currentBlockFormat = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph';

  /**
   * 统一处理段落/标题切换，避免工具栏散落多份逻辑。
   */
  const handleBlockFormatChange = (format: string) => {
    const chain = editor.chain().focus();
    if (format === 'paragraph') {
      chain.setParagraph().run();
      return;
    }
    if (format === 'h1' || format === 'h2' || format === 'h3') {
      const level = Number.parseInt(format.slice(1), 10) as 1 | 2 | 3;
      chain.setHeading({ level }).run();
    }
  };

  /**
   * 高亮控制：选区为空时直接 toggle 默认色（与快捷键行为一致），有选区时套用指定颜色。
   */
  const applyHighlightColor = (color: string) => {
    setLastHighlightColor(color);
    editor.chain().focus().setHighlight({ color }).run();
    setHighlightPaletteOpen(false);
  };

  const clearHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
    setHighlightPaletteOpen(false);
  };

  const toggleHighlightShortcut = () => {
    editor.chain().focus().toggleHighlight({ color: lastHighlightColor }).run();
  };

  const isHighlightActive = editor.isActive('highlight');

  /** 工具栏统一按钮样式：方形 icon 按钮，带悬停反馈与可选激活态。 */
  const iconButtonClass = (active = false) =>
    `inline-flex h-7 w-7 items-center justify-center rounded border text-muted-foreground hover:bg-muted ${
      active ? 'bg-muted text-foreground' : ''
    }`;

  return (
    <div className="relative space-y-2">
      <div className="sticky top-0 z-30 space-y-2 bg-background">
        <div className="flex flex-wrap items-center gap-1.5 rounded border bg-background p-2 shadow-sm">
        <select
          aria-label="文本格式"
          className="rounded border bg-background px-2 py-1 text-xs"
          value={currentBlockFormat}
          onChange={(event) => handleBlockFormatChange(event.target.value)}
        >
          <option value="paragraph">正文</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
        </select>
        <button
          type="button"
          className={iconButtonClass(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="粗体"
          title="粗体 (Ctrl/Cmd + B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="斜体"
          title="斜体 (Ctrl/Cmd + I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="无序列表"
          title="无序列表"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="有序列表"
          title="有序列表"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="引用"
          title="引用"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <div className="inline-flex items-stretch overflow-hidden rounded border">
          <button
            type="button"
            className={`inline-flex h-7 items-center gap-1 px-2 text-muted-foreground hover:bg-muted ${
              isHighlightActive ? 'bg-muted text-foreground' : ''
            }`}
            onClick={toggleHighlightShortcut}
            aria-label="高亮"
            aria-pressed={isHighlightActive}
            title="高亮 (Ctrl/Cmd + Shift + H)"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span
              className="inline-block h-2 w-2 rounded-sm border align-middle"
              style={{ backgroundColor: lastHighlightColor }}
            />
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center border-l px-1 text-muted-foreground hover:bg-muted"
            onClick={() => setHighlightPaletteOpen((value) => !value)}
            aria-label="选择高亮颜色"
            aria-expanded={highlightPaletteOpen}
            title="选择高亮颜色"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          aria-label="插入表格"
          title="插入 3×3 表格"
        >
          <TableIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
          aria-label="增加一行"
          title="在下方增加一行"
        >
          <BetweenHorizontalStart className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          aria-label="增加一列"
          title="在右侧增加一列"
        >
          <BetweenVerticalStart className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          aria-label="删除当前行"
          title="删除当前行"
        >
          <span className="relative inline-flex">
            <Rows3 className="h-3.5 w-3.5" />
            <span className="-bottom-0.5 -right-0.5 absolute text-[8px] leading-none">−</span>
          </span>
        </button>
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          aria-label="删除当前列"
          title="删除当前列"
        >
          <span className="relative inline-flex">
            <Columns3 className="h-3.5 w-3.5" />
            <span className="-bottom-0.5 -right-0.5 absolute text-[8px] leading-none">−</span>
          </span>
        </button>
        <button
          type="button"
          className={iconButtonClass()}
          onClick={() => editor.chain().focus().deleteTable().run()}
          aria-label="删除整个表格"
          title="删除整个表格"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {toolbarRight ? <div className="ml-auto flex items-center gap-2">{toolbarRight}</div> : null}
        </div>
        {highlightPaletteOpen ? (
          <div className="flex flex-wrap items-center gap-2 rounded border border-dashed bg-background p-2 shadow-sm">
            <span className="shrink-0 text-xs text-muted-foreground">高亮颜色</span>
            {HIGHLIGHT_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded border hover:scale-110"
                style={{ backgroundColor: preset.color }}
                aria-label={`应用 ${preset.label} 高亮`}
                title={preset.label}
                onClick={() => applyHighlightColor(preset.color)}
              />
            ))}
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-muted"
              onClick={clearHighlight}
              title="清除高亮"
            >
              清除
            </button>
            <span className="text-[10px] text-muted-foreground">快捷键 Ctrl/Cmd + Shift + H</span>
          </div>
        ) : null}
        {selectedImagePos !== null ? (
          <div className="flex items-center gap-2 rounded border border-dashed bg-background p-2 shadow-sm">
            <span className="shrink-0 text-xs text-muted-foreground">图片 Markdown</span>
            <input
              className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-xs"
              value={selectedImageMarkdown}
              onChange={(event) => setSelectedImageMarkdown(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applySelectedImageMarkdown();
                }
              }}
              placeholder="![alt](https://example.com/image.png)"
            />
            <button className="shrink-0 rounded border px-2 py-1 text-xs" type="button" onClick={applySelectedImageMarkdown}>
              应用
            </button>
          </div>
        ) : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
