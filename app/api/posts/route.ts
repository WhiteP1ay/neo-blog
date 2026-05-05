import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postsTable } from '@/server/db/schema';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { markdownToHTML } from '@/server/utils/markdown';
import { getSession, requireAdminSession } from '@/server/utils/auth';

type CreatePostBody = {
  title?: unknown;
  content?: unknown;
  type?: unknown;
  isHidden?: unknown;
  isPinned?: unknown;
  coverUrl?: unknown;
  excerpt?: unknown;
};

/**
 * 从 Markdown 内容推导文章标题（优先首个 H1）。
 */
function resolvePostTitle(markdownContent: string, fallbackTitle: string): string {
  const firstLine = markdownContent.split('\n')[0]?.trim() ?? '';
  if (firstLine.startsWith('# ')) {
    const heading = firstLine.slice(2).trim();
    if (heading) {
      return heading;
    }
  }
  return fallbackTitle;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const type = (searchParams.get('type') ?? '').trim();
    const rows = await db.query.postsTable.findMany({
      where: (posts, { and, eq }) => {
        const conditions = [];
        if (!includeHidden) {
          conditions.push(eq(posts.isHidden, false));
        }
        if (type) {
          conditions.push(eq(posts.type, type));
        }
        if (conditions.length === 0) return undefined;
        if (conditions.length === 1) return conditions[0];
        return and(...conditions);
      },
      orderBy: (posts, { desc: descFn }) => [descFn(posts.createdAt)],
    });

    return NextResponse.json({
      data: rows.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        isHidden: item.isHidden,
        isPinned: item.isPinned,
        excerpt: item.excerpt ?? '',
        coverUrl: item.coverUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json({ error: '获取文章列表失败' }, { status: 500 });
  }
}

/**
 * 创建文章（管理员）
 */
export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.error === '未登录' ? 401 : 403 },
    );
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    let title = '';
    let markdownContent = '';
    let type = '';
    let isHidden = false;
    let isPinned = false;
    let inputCoverUrl = '';
    let inputExcerpt = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const titleRaw = formData.get('title');
      const typeRaw = formData.get('type');
      const isHiddenRaw = formData.get('isHidden');
      const isPinnedRaw = formData.get('isPinned');
      const coverUrlRaw = formData.get('coverUrl');
      const excerptRaw = formData.get('excerpt');
      const fileRaw = formData.get('file');
      const contentRaw = formData.get('content');

      title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
      type = typeof typeRaw === 'string' ? typeRaw : '';
      isHidden = isHiddenRaw === 'true';
      isPinned = isPinnedRaw === 'true';
      inputCoverUrl = typeof coverUrlRaw === 'string' ? coverUrlRaw.trim() : '';
      inputExcerpt = typeof excerptRaw === 'string' ? excerptRaw.trim() : '';

      if (typeof contentRaw === 'string') {
        markdownContent = contentRaw;
      } else if (fileRaw instanceof File) {
        markdownContent = await fileRaw.text();
        if (!title) {
          const fallbackTitle = fileRaw.name.replace(/\.[^.]+$/i, '').trim() || 'untitled';
          title = resolvePostTitle(markdownContent, fallbackTitle);
        }
      }
    } else {
      const body = (await request.json()) as CreatePostBody;
      title = typeof body.title === 'string' ? body.title.trim() : '';
      markdownContent = typeof body.content === 'string' ? body.content : '';
      type = typeof body.type === 'string' ? body.type : '';
      isHidden = body.isHidden === true;
      isPinned = body.isPinned === true;
      inputCoverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : '';
      inputExcerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : '';
    }

    if (!title) {
      return NextResponse.json({ error: 'title 不能为空' }, { status: 400 });
    }
    if (!markdownContent.trim()) {
      return NextResponse.json({ error: 'content 不能为空' }, { status: 400 });
    }

    const htmlContent = markdownToHTML(markdownContent);
    const metadata = derivePostMetadata({
      markdownContent,
      content: htmlContent,
    });

    const inserted = await db
      .insert(postsTable)
      .values({
        title,
        type,
        isHidden,
        isPinned,
        content: htmlContent,
        markdownContent,
        coverUrl: inputCoverUrl || metadata.coverUrl,
        excerpt: inputExcerpt || metadata.excerpt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}
