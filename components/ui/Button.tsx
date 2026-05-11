import React from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-coya-green text-white hover:bg-coya-green-light focus-visible:ring-coya-green/30',
  secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-200',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {leftIcon ? <span className="shrink-0" aria-hidden>{leftIcon}</span> : null}
        <span className="truncate">{children}</span>
        {rightIcon ? <span className="shrink-0" aria-hidden>{rightIcon}</span> : null}
      </button>
    );
  },
);
Button.displayName = 'Button';

