interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

/**
 * 空状态组件
 */
export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-8 sm:py-12 text-gray-500">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p>{message}</p>
    </div>
  );
}

