import React from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, rightElement, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'coya-input w-full',
              rightElement ? 'pr-10' : undefined,
              error ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : undefined,
              className,
            )}
            {...props}
          />
          {rightElement ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          ) : null}
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

