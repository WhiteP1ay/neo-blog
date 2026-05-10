import { asc, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { requireAdmin } from '@/server/utils/require-admin';
import { markdownToHTML } from '@/server/utils/markdown';
import { derivePostMetadata } from '@/server/utils/post-metadata';

type CreatePostBody = {
  title?: unknown;
  content?: unknown;
  markdownContent?: unknown;
  excerpt?: unknown;
  coverUrl?: unknown;
  type?: unknown;
  isHidden?: unknown;
  // mode=zen 时跳过封面/摘要自动派生，按调用方传值（通常为空）保存。
  mode?: unknown;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  // 列表仅返回轻量元字段；正文 HTML/Markdown 体积可达数十 KB，
  // 走代理/远程链路时拉全表会导致首屏 8-12s，编辑时再按 id 单独获取。
  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      type: postsTable.type,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,
    })
    .from(postsTable)
    .orderBy(asc(postsTable.sortOrder), desc(postsTable.createdAt), asc(postsTable.id));
  return NextResponse.json({ data: posts });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let title = '';
  let markdownContent = '';
  let type = '';
  let isHidden = false;
  let inputCoverUrl = '';
  let inputExcerpt = '';
  let mode: 'traditional' | 'zen' = 'traditional';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const titleRaw = formData.get('title');
    const typeRaw = formData.get('type');
    const isHiddenRaw = formData.get('isHidden');
    const coverUrlRaw = formData.get('coverUrl');
    const excerptRaw = formData.get('excerpt');
    const fileRaw = formData.get('file');
    const contentRaw = formData.get('content');

    title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
    type = typeof typeRaw === 'string' ? typeRaw : '';
    isHidden = isHiddenRaw === 'true';
    inputCoverUrl = typeof coverUrlRaw === 'string' ? coverUrlRaw.trim() : '';
    inputExcerpt = typeof excerptRaw === 'string' ? excerptRaw.trim() : '';

    // multipart 里 content 可能被提交为空字符串；此时应回退读取文件内容。
    if (typeof contentRaw === 'string' && contentRaw.trim()) {
      markdownContent = contentRaw;
    } else if (fileRaw instanceof File) {
      markdownContent = await fileRaw.text();
      if (!title) {
        const firstLine = markdownContent.split('\n')[0]?.trim() ?? '';
        const heading = firstLine.startsWith('# ') ? firstLine.slice(2).trim() : '';
        title = heading || fileRaw.name.replace(/\.[^.]+$/i, '').trim() || 'untitled';
      }
    }
  } else {
    const body = (await request.json()) as CreatePostBody;
    title = typeof body.title === 'string' ? body.title.trim() : '';
    markdownContent = typeof body.content === 'string' ? body.content : '';
    type = typeof body.type === 'string' ? body.type : '';
    isHidden = body.isHidden === true;
    inputCoverUrl = typeof body.coverUrl === 'string' ? body.coverUrl : '';
    inputExcerpt = typeof body.excerpt === 'string' ? body.excerpt : '';
    if (body.mode === 'zen') mode = 'zen';
  }

  const content = markdownToHTML(markdownContent);
  const metadata = derivePostMetadata({
    markdownContent,
    content,
  });

  if (!title) {
    return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
  }
  if (!markdownContent.trim()) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }

  // mode=zen 时默认不派生封面/摘要，按调用方传值（通常为空字符串）保存。
  const finalExcerpt = mode === 'zen' ? inputExcerpt : (inputExcerpt || metadata.excerpt);
  const finalCoverUrl = mode === 'zen' ? inputCoverUrl : (inputCoverUrl || metadata.coverUrl);

  const created = await db
    .insert(postsTable)
    .values({
      title,
      content,
      markdownContent: markdownContent || null,
      excerpt: finalExcerpt,
      coverUrl: finalCoverUrl,
      type,
      // 让新文章天然落到列表最前：取当前最小 sortOrder 再 -1（无文章时回落到 0）。
      // C 端排序为 sortOrder ASC, createdAt DESC，新文章自然在前，且不破坏已有手动顺序。
      sortOrder:
        ((await db
          .select({ id: postsTable.id, sortOrder: postsTable.sortOrder })
          .from(postsTable)
          .orderBy(asc(postsTable.sortOrder))
          .limit(1))[0]?.sortOrder ?? 1) - 1,
      isHidden,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    // 同 PUT，仅回元字段，省掉刚插入的整段 HTML 再回传一次。
    .returning({
      id: postsTable.id,
      title: postsTable.title,
      type: postsTable.type,
      sortOrder: postsTable.sortOrder,
      isHidden: postsTable.isHidden,
      isPinned: postsTable.isPinned,
      coverUrl: postsTable.coverUrl,
      excerpt: postsTable.excerpt,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,
    });

  return NextResponse.json({ data: created[0] });
}
