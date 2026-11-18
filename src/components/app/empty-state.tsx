import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
