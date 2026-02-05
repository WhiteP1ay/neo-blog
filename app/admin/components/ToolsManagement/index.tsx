"use client";

import { useState, useEffect, useCallback } from "react";
import { getTools, type Tool } from "@/server/actions/tools";
import { ToolsTable } from "./ToolsTable";
import { ToolForm } from "./ToolForm";
import { useToast } from "@/app/components/Toast";

type ViewMode = "list" | "create" | "edit";

/**
 * 工具管理组件
 */
export function ToolsManagement() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const { showToast } = useToast();

  /**
   * 加载工具列表
   */
  const loadTools = useCallback(async () => {
    setLoading(true);
    const result = await getTools(true); // 包含隐藏的工具
    if (result.success && result.data) {
      setTools(result.data);
    } else {
      showToast(`加载失败: ${result.error}`, "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  /**
   * 处理创建工具
   */
  const handleCreate = () => {
    setEditingTool(null);
    setViewMode("create");
  };

  /**
   * 处理编辑工具
   */
  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setViewMode("edit");
  };

  /**
   * 处理返回列表
   */
  const handleBack = () => {
    setViewMode("list");
    setEditingTool(null);
    loadTools();
  };

  if (loading && viewMode === "list") {
    return (
      <div className="text-center py-8 text-gray-500">加载中...</div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <ToolForm
        tool={editingTool}
        mode={viewMode}
        onSuccess={handleBack}
        onCancel={handleBack}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">工具管理</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建工具
        </button>
      </div>

      <ToolsTable
        tools={tools}
        onEdit={handleEdit}
        onDelete={async (id) => {
          if (confirm("确定要删除这个工具吗？")) {
            const { deleteTool } = await import("@/server/actions/tools");
            const result = await deleteTool(id);
            if (result.success) {
              showToast("删除成功", "success");
              loadTools();
            } else {
              showToast(`删除失败: ${result.error}`, "error");
            }
          }
        }}
        onToggleHidden={async (tool) => {
          const { updateTool } = await import("@/server/actions/tools");
          const result = await updateTool(tool.id, {
            isHidden: !tool.isHidden,
          });
          if (result.success) {
            showToast(tool.isHidden ? "已显示" : "已隐藏", "success");
            loadTools();
          } else {
            showToast(`操作失败: ${result.error}`, "error");
          }
        }}
        onRefresh={loadTools}
      />
    </div>
  );
}

