import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './button';
import {
  InboxIcon,
  DocumentIcon,
  FolderIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const defaultIcons = {
  inbox: InboxIcon,
  document: DocumentIcon,
  folder: FolderIcon,
  search: MagnifyingGlassIcon,
};

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }> | keyof typeof defaultIcons;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: ButtonProps['variant'];
  };
}

export function EmptyState({
  icon: Icon = 'inbox',
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const IconComponent = typeof Icon === 'string' ? defaultIcons[Icon] : Icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button variant={action.variant || 'default'} asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button variant={action.variant || 'default'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoDataEmptyState({
  title = 'No data yet',
  description = 'Get started by creating your first item.',
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon="inbox"
      title={title}
      description={description}
      action={action}
      {...props}
    />
  );
}

export function NoResultsEmptyState({
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon="search"
      title={title}
      description={description}
      action={action}
      {...props}
    />
  );
}

export function NoDocumentsEmptyState({
  title = 'No documents',
  description = 'Upload or create a new document to get started.',
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon="document"
      title={title}
      description={description}
      action={action}
      {...props}
    />
  );
}

