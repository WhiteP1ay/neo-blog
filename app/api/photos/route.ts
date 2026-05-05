import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { photosTable } from '@/server/db/schema';
import { uploadPhotoToOss } from '@/server/utils/oss';
import { getSession, requireAdminSession } from '@/server/utils/auth';

type CreatePhotoBody = {
  title?: unknown;
  description?: unknown;
  coverUrl?: unknown;
  type?: unknown;
  isHidden?: unknown;
};

/**
 * 对外 photos 列表。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const rows = await db.query.photosTable.findMany({
      where: includeHidden
        ? undefined
        : (photos, { eq }) => eq(photos.isHidden, false),
      orderBy: (photos, { desc: descFn }) => [descFn(photos.createdAt)],
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('获取 photos 列表失败:', error);
    return NextResponse.json({ error: '获取 photos 列表失败' }, { status: 500 });
  }
}

/**
 * 创建 photo（管理员）
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
    let description: string | null = null;
    let coverUrl: string | null = null;
    let type = '';
    let isHidden = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const titleRaw = formData.get('title');
      const descriptionRaw = formData.get('description');
      const typeRaw = formData.get('type');
      const isHiddenRaw = formData.get('isHidden');
      const coverUrlRaw = formData.get('coverUrl');
      const fileRaw = formData.get('file');

      title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
      description = typeof descriptionRaw === 'string' ? descriptionRaw : null;
      type = typeof typeRaw === 'string' ? typeRaw : '';
      isHidden = isHiddenRaw === 'true';
      coverUrl = typeof coverUrlRaw === 'string' ? coverUrlRaw : null;

      if (!coverUrl && fileRaw instanceof File) {
        if (!fileRaw.type.startsWith('image/')) {
          return NextResponse.json({ error: '仅支持图片文件上传' }, { status: 400 });
        }
        const uploadResult = await uploadPhotoToOss(fileRaw);
        coverUrl = uploadResult.publicUrl;
      }
      if (!title && fileRaw instanceof File) {
        title = fileRaw.name.replace(/\.[^.]+$/i, '').trim() || 'untitled-photo';
      }
    } else {
      const body = (await request.json()) as CreatePhotoBody;
      title = typeof body.title === 'string' ? body.title.trim() : '';
      description = typeof body.description === 'string' ? body.description : null;
      coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl : null;
      type = typeof body.type === 'string' ? body.type : '';
      isHidden = body.isHidden === true;
    }

    if (!title) {
      return NextResponse.json({ error: 'title 不能为空' }, { status: 400 });
    }

    const inserted = await db
      .insert(photosTable)
      .values({
        title,
        description,
        coverUrl,
        type,
        isHidden,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('创建 photo 失败:', error);
    return NextResponse.json({ error: '创建 photo 失败' }, { status: 500 });
  }
}
