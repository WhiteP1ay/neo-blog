'use client';

import type { Topic } from '@/server/actions/topics';

interface TopicsTableProps {
  topics: Topic[];
  onEdit: (topic: Topic) => void;
  onDelete: (id: number) => void;
  onToggleHidden: (topic: Topic) => void;
  onTogglePinned: (topic: Topic) => void;
  onRefresh: () => void;
}

/**
 * 专题表格组件
 */
export function TopicsTable({ topics, onEdit, onDelete, onToggleHidden, onTogglePinned }: TopicsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">置顶</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  暂无专题
                </td>
              </tr>
            ) : (
              topics.map((topic) => (
                <tr key={topic.id}>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-medium text-gray-900">{topic.name}</span>
                      {topic.isPinned && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          置顶
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {topic.description || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <button
                      onClick={() => onTogglePinned(topic)}
                      className={`text-xs sm:text-sm px-2 py-1 rounded ${
                        topic.isPinned
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {topic.isPinned ? '已置顶' : '置顶'}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        topic.isHidden ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {topic.isHidden ? '已隐藏' : '显示中'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                    {new Date(topic.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onEdit(topic)}
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => onToggleHidden(topic)}
                        className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                      >
                        {topic.isHidden ? '显示' : '隐藏'}
                      </button>
                      <button
                        onClick={() => onDelete(topic.id)}
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
