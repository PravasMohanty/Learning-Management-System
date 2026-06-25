import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data",
  description = "There are no records to display.",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-description">{description}</div>
      {action && action}
    </div>
  );
}
