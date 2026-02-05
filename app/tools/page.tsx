import type { Metadata } from "next";
import { getTools } from "@/server/actions/tools";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { ToolCard } from "@/app/components/ToolCard";
import { EmptyState } from "@/app/components/EmptyState";

export const metadata: Metadata = {
  title: "工具",
  description: "White Meta 博客 - 工具列表",
};

export const revalidate = 60;

/**
 * 工具列表页面（网格布局）
 */
export default async function ToolsPage() {
  const result = await getTools(false); // 不包含隐藏的工具
  const tools = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <Breadcrumb />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">工具</h1>
        </header>

        {tools.length === 0 ? (
          <EmptyState message="暂无工具" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

