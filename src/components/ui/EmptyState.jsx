export default function EmptyState({ title = 'Nothing here yet', description, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="mb-3 text-4xl text-faint" />}
      <p className="font-medium text-body">{title}</p>
      {description && <p className="mt-1 text-sm text-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
