import type { Metadata } from 'next';
import type { Post } from '@/server/types/models';
import { Suspense } from 'react';
import { getPostById } from '@/server/actions/posts';
import { getExplorerTree } from '@/server/actions/explorer-nodes';
import { HomeExplorer } from '@/components/admin';
import { getSession } from '@/server/utils/auth';
import { highlightCodeBlocksInHtml } from '@/server/utils/highlight-code-blocks-in-html';
import { ModalProvider } from './ModalProvider';
import { AboutPageContent } from '@/app/(site)/about/AboutPageContent';
import { PrivacyPageContent } from '@/app/(site)/privacy/PrivacyPageContent';
import { ToolsPageContent } from '@/app/(site)/tools/ToolsPageContent';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Home',
  description: 'White Meta 的内容浏览与管理入口',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const isAdminLoggedIn = session?.isAdmin === true;
  const treeResult = await getExplorerTree();

  if (!treeResult.success) {
    return (
      <div className="bg-muted/40 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
          暂时无法加载内容，请稍后再试。
        </main>
      </div>
    );
  }

  const tree = treeResult.data;
  const flatten = (nodes: typeof tree): typeof tree => nodes.flatMap((node) => [node, ...flatten(node.children)]);
  const allNodes = flatten(tree);
  const selectedNodeId = sp.node ? Number.parseInt(sp.node, 10) : Number.NaN;
  const selectedNode = Number.isFinite(selectedNodeId) ? allNodes.find((node) => node.id === selectedNodeId) ?? null : tree[0] ?? null;

  let postDetail: Post | null = null;
  if (selectedNode?.nodeType === 'markdown' && selectedNode.linkedPostId != null) {
    const pr = await getPostById(selectedNode.linkedPostId, false);
    if (pr.success && pr.data) postDetail = pr.data;
  }

  const serializedPost = postDetail
    ? {
      id: postDetail.id,
      title: postDetail.title,
      content: await highlightCodeBlocksInHtml(postDetail.content),
      contentSource: postDetail.content,
      createdAt: postDetail.createdAt?.toISOString() ?? null,
      updatedAt: postDetail.updatedAt?.toISOString() ?? null,
    }
    : null;

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="h-dvh min-h-[420px] w-full min-w-0">
          <Suspense fallback={null}>
            <HomeExplorer
              tree={tree}
              selectedNode={selectedNode}
              postDetail={serializedPost}
              isAdminLoggedIn={isAdminLoggedIn}
            />
          </Suspense>
        </div>
        <ModalProvider
          aboutSlot={<AboutPageContent />}
          privacySlot={<PrivacyPageContent />}
          toolsSlot={<ToolsPageContent />}
        />
      </main>
    </div>
  );
}

