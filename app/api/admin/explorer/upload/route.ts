import { NextResponse } from 'next/server';
import { createMarkdownFileFromForm, createPhotoFileFromForm } from '@/server/actions/explorer-nodes';
import { getSession, requireAdminSession } from '@/server/utils/auth';
import { isMarkdownUpload } from '@/server/utils/upload-file';

export async function POST(request: Request) {
  const gate = requireAdminSession(await getSession());
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: gate.error === '未登录' ? 401 : 403 });
  }

  try {
    const formData = await request.formData();
    const parentIdRaw = formData.get('parentId');
    const parentId = Number.parseInt(String(parentIdRaw ?? ''), 10);
    if (!Number.isFinite(parentId) || parentId <= 0) {
      return NextResponse.json({ success: false, error: 'parentId 无效' }, { status: 400 });
    }
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: '未找到上传文件' }, { status: 400 });
    }
    const result = isMarkdownUpload(file)
      ? await createMarkdownFileFromForm(parentId, formData)
      : await createPhotoFileFromForm(parentId, formData);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json({ success: false, error: '上传文件失败' }, { status: 500 });
  }
}
