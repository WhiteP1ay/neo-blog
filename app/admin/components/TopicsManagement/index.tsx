"use client";

import { useState, useEffect, useCallback } from "react";
import { getTopics, type Topic } from "@/server/actions/topics";
import { TopicsTable } from "./TopicsTable";
import { TopicForm } from "./TopicForm";
import { useToast } from "@/app/components/Toast";

type ViewMode = "list" | "create" | "edit";

/**
 * 专题管理组件
 */
export function TopicsManagement() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const { showToast } = useToast();

  /**
   * 加载专题列表
   */
  const loadTopics = useCallback(async () => {
    setLoading(true);
    const result = await getTopics(true); // 包含隐藏的专题
    if (result.success && result.data) {
      setTopics(result.data);
    } else {
      showToast(`加载失败: ${result.error}`, "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  /**
   * 处理创建专题
   */
  const handleCreate = () => {
    setEditingTopic(null);
    setViewMode("create");
  };

  /**
   * 处理编辑专题
   */
  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setViewMode("edit");
  };

  /**
   * 处理返回列表
   */
  const handleBack = () => {
    setViewMode("list");
    setEditingTopic(null);
    loadTopics();
  };

  if (loading && viewMode === "list") {
    return (
      <div className="text-center py-8 text-gray-500">加载中...</div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <TopicForm
        topic={editingTopic}
        mode={viewMode}
        onSuccess={handleBack}
        onCancel={handleBack}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">专题管理</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建专题
        </button>
      </div>

      <TopicsTable
        topics={topics}
        onEdit={handleEdit}
        onDelete={async (id) => {
          if (confirm("确定要删除这个专题吗？")) {
            const { deleteTopic } = await import("@/server/actions/topics");
            const result = await deleteTopic(id);
            if (result.success) {
              showToast("删除成功", "success");
              loadTopics();
            } else {
              showToast(`删除失败: ${result.error}`, "error");
            }
          }
        }}
        onToggleHidden={async (topic) => {
          const { updateTopic } = await import("@/server/actions/topics");
          const result = await updateTopic(topic.id, {
            isHidden: !topic.isHidden,
          });
          if (result.success) {
            showToast(topic.isHidden ? "已显示" : "已隐藏", "success");
            loadTopics();
          } else {
            showToast(`操作失败: ${result.error}`, "error");
          }
        }}
        onTogglePinned={async (topic) => {
          const { updateTopic } = await import("@/server/actions/topics");
          const result = await updateTopic(topic.id, {
            isPinned: !topic.isPinned,
          });
          if (result.success) {
            showToast(topic.isPinned ? "已取消置顶" : "已置顶", "success");
            loadTopics();
          } else {
            showToast(`操作失败: ${result.error}`, "error");
          }
        }}
        onRefresh={loadTopics}
      />
    </div>
  );
}

