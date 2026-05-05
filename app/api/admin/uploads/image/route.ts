import { NextResponse } from 'next/server';
import { uploadPhotoToOss } from '@/server/utils/oss';
import { requireAdmin } from '@/server/utils/require-admin';

/**
 * 仅上传图片到 OSS，返回 URL，不写入数据库。
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const formData = await request.formData();
  const fileRaw = formData.get('file');
  if (!(fileRaw instanceof File)) {
    return NextResponse.json({ error: '缺少图片文件' }, { status: 400 });
  }
  if (!fileRaw.type.startsWith('image/')) {
    return NextResponse.json({ error: '仅支持图片文件上传' }, { status: 400 });
  }

  const uploadResult = await uploadPhotoToOss(fileRaw);
  return NextResponse.json({
    data: {
      url: uploadResult.publicUrl,
    },
  });
}
