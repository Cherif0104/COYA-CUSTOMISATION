import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Language } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { AnalyticsWorkspaceFloorplan } from '../../ui-runtime';

export interface ModuleSection {
  key: string;
  titleFr: string;
  titleEn: string;
  icon?: string;
  content: React.ReactNode;
}

interface StructuredModulePageProps {
  moduleKey: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  icon?: string;
  /** CTA / actions à droite du titre (même emplacement que `WorkspaceHeader` des modules Projets, etc.). */
  moduleHeaderActions?: React.ReactNode;
  sections?: ModuleSection[];
  children?: React.ReactNode;
}

/**
 * Page de module alignée **MAKE FIGMA** / même floorplan que le cockpit RH :
 * `AnalyticsWorkspaceFloorplan` → WorkspaceShell `p-6 space-y-6`.
 */
const StructuredModulePage: React.FC<StructuredModulePageProps> = ({
  moduleKey: _moduleKey,
  titleFr,
  titleEn,
  descriptionFr,
  descriptionEn,
  icon = 'fas fa-puzzle-piece',
  moduleHeaderActions,
  sections = [],
  children,
}) => {
  const { language } = useLocalization();
  const isFr = language === Language.FR;
  const title = isFr ? titleFr : titleEn;
  const description = isFr ? descriptionFr : descriptionEn;

  return (
    <AnalyticsWorkspaceFloorplan
      className="font-coya min-h-0 bg-[var(--coya-enterprise-bg,#F8FAFC)] text-[var(--coya-enterprise-text)] !shadow-none"
      title={title}
      subtitle={description}
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {moduleHeaderActions}
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--coya-enterprise-border)] bg-white text-[var(--coya-enterprise-muted)] shadow-sm sm:h-12 sm:w-12"
            aria-hidden
          >
            <i className={`${icon} text-lg sm:text-xl`} />
          </span>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        {children}
        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((sec) => (
              <Card key={sec.key}>
                <CardContent>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-[var(--coya-enterprise-text)]">
                    {sec.icon && <i className={`${sec.icon} text-[var(--coya-enterprise-muted)]`} />}
                    {isFr ? sec.titleFr : sec.titleEn}
                  </h3>
                  {sec.content}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AnalyticsWorkspaceFloorplan>
  );
};

export default StructuredModulePage;
