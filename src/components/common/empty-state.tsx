import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
