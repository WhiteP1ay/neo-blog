import { useRouter } from "next/navigation";
import { deletePost, type Post } from "@/server/actions/posts";
import { useToast } from "@/app/components/Toast";

/**
 * 文章操作Hook
 */
export function usePostActions(onSuccess?: () => void) {
  const router = useRouter();
  const { showToast } = useToast();

  /**
   * 删除文章
   */
  const handleDeletePost = async (id: number) => {
    if (!confirm("确定要删除这篇文章吗？")) {
      return;
    }

    const result = await deletePost(id);
    if (result.success) {
      showToast("删除成功", "success");
      onSuccess?.();
    } else {
      showToast(`删除失败: ${result.error}`, "error");
    }
  };

  /**
   * 下载文章
   */
  const handleDownloadPost = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/download`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || "下载失败";
        showToast(errorMessage, "error");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${post.title.replace(/[^\w\s-]/g, "").trim()}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("下载失败:", error);
      showToast("下载失败", "error");
    }
  };

  /**
   * 编辑文章（跳转到编辑页面）
   */
  const handleEditPost = (id: number) => {
    router.push(`/admin/${id}`);
  };

  return {
    handleDeletePost,
    handleDownloadPost,
    handleEditPost,
  };
}
