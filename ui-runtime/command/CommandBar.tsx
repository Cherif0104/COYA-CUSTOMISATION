import React, { PropsWithChildren } from 'react';

export type CommandBarProps = PropsWithChildren<{
  className?: string;
}>;

/** Zone CTA / commandes primaires (alignée header MAKE FIGMA). */
export const CommandBar: React.FC<CommandBarProps> = ({ className = '', children }) => (
  <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`.trim()}>{children}</div>
);

/** Bouton primaire workspace (couleur canon COYA / Figma). */
export const PrimaryWorkspaceButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`flex items-center gap-2 rounded-xl bg-[#0d1b2a] px-4 py-2.5 text-sm text-white transition-colors hover:bg-[#1a3a5c] disabled:opacity-50 ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

export default CommandBar;
