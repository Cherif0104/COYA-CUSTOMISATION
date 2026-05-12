/**
 * Jetons visuels Parc auto / logistique — alignés sur le floorplan « entreprise »
 * (`StructuredModulePage`, `--coya-enterprise-*`) et le bundle MAKE FIGMA du dépôt
 * (`make figma/README.md` → ERP-CRM-Dashboard).
 */
export const fleetDesignTokens = {
  pageBg: 'bg-[var(--coya-enterprise-bg,#F8FAFC)]',
  text: 'text-[var(--coya-enterprise-text,#0f172a)]',
  muted: 'text-[var(--coya-enterprise-muted,#64748b)]',
  border: 'border-[var(--coya-enterprise-border,#e2e8f0)]',
  cardRadius: 'rounded-2xl',
  cardShadow: 'shadow-sm',
  /** Carte standard (liste / KPI) */
  surfaceCard: `rounded-2xl border border-[var(--coya-enterprise-border,#e2e8f0)] bg-white shadow-sm`,
  /** Bandeau héros fiche détail */
  heroCard:
    'rounded-2xl border border-[var(--coya-enterprise-border,#e2e8f0)] bg-gradient-to-br from-white to-slate-50 shadow-sm',
  stickyNav:
    'sticky top-0 z-30 border-b border-[var(--coya-enterprise-border,#e2e8f0)] bg-[var(--coya-enterprise-bg,#F8FAFC)]/95 backdrop-blur-md',
} as const;

export function fleetPageShellClass(): string {
  return `${fleetDesignTokens.pageBg} ${fleetDesignTokens.text} min-h-full`;
}
