import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { db } from '@/server/db/db';
import { explorerNodesTable, photosTable, postsTable } from '@/server/db/schema';

/**
 * 低频定时任务：清理悬挂资源节点。
 *
 * “悬挂节点”定义：
 * - nodeType=markdown，但无对应 posts.nodeId
 * - nodeType=photo，但无对应 photos.nodeId
 */
async function cleanupDanglingNodesJob() {
  const [nodes, posts, photos] = await Promise.all([
    db.select({ id: explorerNodesTable.id, nodeType: explorerNodesTable.nodeType }).from(explorerNodesTable),
    db.select({ nodeId: postsTable.nodeId }).from(postsTable),
    db.select({ nodeId: photosTable.nodeId }).from(photosTable),
  ]);

  const postNodeIds = new Set<number>();
  for (const post of posts) {
    if (post.nodeId != null) postNodeIds.add(post.nodeId);
  }

  const photoNodeIds = new Set<number>();
  for (const photo of photos) {
    photoNodeIds.add(photo.nodeId);
  }

  const danglingIds: number[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'markdown' && !postNodeIds.has(node.id)) danglingIds.push(node.id);
    if (node.nodeType === 'photo' && !photoNodeIds.has(node.id)) danglingIds.push(node.id);
  }

  if (danglingIds.length === 0) {
    console.log('ℹ️ 未发现悬挂节点');
    return;
  }

  await db.delete(explorerNodesTable).where(inArray(explorerNodesTable.id, danglingIds));
  console.log(`✅ 已清理悬挂节点 ${danglingIds.length} 个`);
}

cleanupDanglingNodesJob()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ 清理悬挂节点失败:', message);
    process.exit(1);
  });
