import React from 'react';
import { cn } from './cn';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string } & Pick<ButtonProps, 'onClick' | 'variant'>;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('coya-card-padded flex flex-col items-center text-center', className)}>
      {icon ? (
        <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 mb-3">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description ? <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p> : null}
      {action ? (
        <div className="mt-4">
          <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

