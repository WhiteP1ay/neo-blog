import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db/db';
import { photosTable } from '@/server/db/schema';
import { uploadPhotoToOss } from '@/server/utils/oss';
import { requireAdmin } from '@/server/utils/require-admin';

type CreatePhotoBody = {
  title?: unknown;
  description?: unknown;
  coverUrl?: unknown;
  type?: unknown;
  isHidden?: unknown;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const photos = await db.select().from(photosTable).orderBy(asc(photosTable.id));
  return NextResponse.json({ data: photos });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

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
    return NextResponse.json({ error: '照片标题不能为空' }, { status: 400 });
  }

  const created = await db
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

  return NextResponse.json({ data: created[0] });
}
