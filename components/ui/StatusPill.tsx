import React from 'react';
import { cn } from './cn';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusPillProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

const tones: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-800',
};

export function StatusPill({ tone = 'neutral', children, className }: StatusPillProps) {
  return <span className={cn('coya-badge', tones[tone], className)}>{children}</span>;
}

