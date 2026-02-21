'use client';

import type { Tool } from '@/server/actions/tools';

interface ToolsTableProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onDelete: (id: number) => void;
  onToggleHidden: (tool: Tool) => void;
  onRefresh: () => void;
}

/**
 * 工具表格组件
 */
export function ToolsTable({ tools, onEdit, onDelete, onToggleHidden }: ToolsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">链接</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tools.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  暂无工具
                </td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id}>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm sm:text-base font-medium text-gray-900">{tool.name}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {tool.description || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
                    >
                      {tool.url}
                    </a>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        tool.isHidden ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {tool.isHidden ? '已隐藏' : '显示中'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                    {new Date(tool.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onEdit(tool)}
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => onToggleHidden(tool)}
                        className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                      >
                        {tool.isHidden ? '显示' : '隐藏'}
                      </button>
                      <button
                        onClick={() => onDelete(tool.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
