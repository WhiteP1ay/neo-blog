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
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const posts = await db
    .select()
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

  const created = await db
    .insert(postsTable)
    .values({
      title,
      content,
      markdownContent: markdownContent || null,
      excerpt: inputExcerpt || metadata.excerpt,
      coverUrl: inputCoverUrl || metadata.coverUrl,
      type,
      sortOrder:
        ((await db
          .select({ id: postsTable.id, sortOrder: postsTable.sortOrder })
          .from(postsTable)
          .orderBy(desc(postsTable.sortOrder))
          .limit(1))[0]?.sortOrder ?? 0) + 1,
      isHidden,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: created[0] });
}
