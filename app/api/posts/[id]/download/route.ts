import { NextRequest, NextResponse } from 'next/server';
import { getPostById } from '@/server/actions/posts';
import { getSession } from '@/server/utils/auth';

/**
 * 下载文章为Markdown文件
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 检查登录状态
  const userId = await getSession();
  if (!userId) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ success: false, error: '无效的文章ID' }, { status: 400 });
    }

    const result = await getPostById(postId);
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 });
    }

    const post = result.data;

    // 检查是否有markdown内容
    if (!post.markdownContent) {
      return NextResponse.json({ success: false, error: '该文章没有保存Markdown源文件，无法下载' }, { status: 400 });
    }

    // 生成文件名（使用标题，清理特殊字符）
    const fileName = `${post.title.replace(/[^\w\s-]/g, '').trim()}.md`;

    // 返回文件下载
    return new NextResponse(post.markdownContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('下载文章失败:', error);
    return NextResponse.json({ success: false, error: '下载文章失败' }, { status: 500 });
  }
}
