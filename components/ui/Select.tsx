import React from 'react';
import { cn } from './cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return <select ref={ref} className={cn('coya-select w-full', className)} {...props} />;
});
Select.displayName = 'Select';

