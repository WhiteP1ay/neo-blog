import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { postTypeAssignmentsTable, postTypesTable, postsTable } from '@/server/db/schema';
import { derivePostMetadata } from '@/server/utils/post-metadata';
import { markdownToHTML } from '@/server/utils/markdown';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { parseTypeIdsField } from '@/server/utils/parse-type-ids';
import { loadTypesByPostIds, replacePostTypeAssignments, type PostTypeRow } from '@/server/utils/post-type-assignments';

type CreatePostBody = {
  title?: unknown;
  content?: unknown;
  typeIds?: unknown;
  isHidden?: unknown;
  isPinned?: unknown;
  coverUrl?: unknown;
  excerpt?: unknown;
};

function summarizeTypes(rows: PostTypeRow[]) {
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    nameZh: t.nameZh,
    nameEn: t.nameEn,
  }));
}

async function assertTypeIdsValid(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await db
    .select({ id: postTypesTable.id })
    .from(postTypesTable)
    .where(inArray(postTypesTable.id, ids));
  return rows.length === ids.length;
}

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
    const typeCode = (searchParams.get('typeSlug') ?? searchParams.get('type') ?? '').trim();

    let postIdFilter: number[] | null = null;
    if (typeCode) {
      const typeRow = await db.query.postTypesTable.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.code, typeCode),
      });
      if (!typeRow) {
        return NextResponse.json({ data: [] });
      }
      const links = await db
        .select({ postId: postTypeAssignmentsTable.postId })
        .from(postTypeAssignmentsTable)
        .where(eq(postTypeAssignmentsTable.typeId, typeRow.id));
      postIdFilter = links.map((l) => l.postId);
      if (postIdFilter.length === 0) {
        return NextResponse.json({ data: [] });
      }
    }

    const rows = await db.query.postsTable.findMany({
      where: (posts, { and: andFn, eq: eqFn, inArray: inArr }) => {
        const conditions = [];
        if (!includeHidden) {
          conditions.push(eqFn(posts.isHidden, false));
        }
        if (postIdFilter) {
          conditions.push(inArr(posts.id, postIdFilter));
        }
        if (conditions.length === 0) return undefined;
        if (conditions.length === 1) return conditions[0];
        return andFn(...conditions);
      },
      orderBy: (posts, { asc: ascFn, desc: descFn }) => [ascFn(posts.sortOrder), descFn(posts.createdAt)],
    });

    const typeMap = await loadTypesByPostIds(
      db,
      rows.map((item) => item.id),
    );

    return NextResponse.json({
      data: rows.map((item) => ({
        id: item.id,
        title: item.title,
        types: summarizeTypes(typeMap.get(item.id) ?? []),
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
    let typeIds: number[] = [];
    let isHidden = false;
    let isPinned = false;
    let inputCoverUrl = '';
    let inputExcerpt = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const titleRaw = formData.get('title');
      const isHiddenRaw = formData.get('isHidden');
      const isPinnedRaw = formData.get('isPinned');
      const coverUrlRaw = formData.get('coverUrl');
      const excerptRaw = formData.get('excerpt');
      const fileRaw = formData.get('file');
      const contentRaw = formData.get('content');

      title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
      isHidden = isHiddenRaw === 'true';
      isPinned = isPinnedRaw === 'true';
      inputCoverUrl = typeof coverUrlRaw === 'string' ? coverUrlRaw.trim() : '';
      inputExcerpt = typeof excerptRaw === 'string' ? excerptRaw.trim() : '';

      if (typeof contentRaw === 'string' && contentRaw.trim()) {
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
      const parsed = parseTypeIdsField(body.typeIds);
      if (parsed !== 'omit' && parsed.ok) {
        typeIds = parsed.ids;
      } else if (parsed !== 'omit') {
        return NextResponse.json({ error: 'typeIds 无效' }, { status: 400 });
      }
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

    if (!(await assertTypeIdsValid(typeIds))) {
      return NextResponse.json({ error: '存在无效的类型 id' }, { status: 400 });
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
        sortOrder:
          ((await db
            .select({ id: postsTable.id, sortOrder: postsTable.sortOrder })
            .from(postsTable)
            .orderBy(desc(postsTable.sortOrder))
            .limit(1))[0]?.sortOrder ?? 0) + 1,
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

    const row = inserted[0];
    if (!row) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }
    await replacePostTypeAssignments(db, row.id, typeIds);
    const typeMap = await loadTypesByPostIds(db, [row.id]);

    return NextResponse.json(
      {
        data: {
          ...row,
          types: summarizeTypes(typeMap.get(row.id) ?? []),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}
