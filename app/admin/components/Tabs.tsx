'use client';

interface TabsProps<T extends string = string> {
  activeTab: T;
  tabs: Array<{ id: T; label: string }>;
  onTabChange: (tab: T) => void;
}

/**
 * 标签页组件
 */
export function Tabs<T extends string = string>({ activeTab, tabs, onTabChange }: TabsProps<T>) {
  return (
    <div className="mb-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 font-medium ${
            activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
