import React, { PropsWithChildren } from 'react';

/**
 * Coquille passive : la maquette Figma n'utilise PAS de hero-panel global.
 * Chaque module gère son propre header interne (titre + CTA) à l'intérieur d'un
 * conteneur `p-6 space-y-6` (cf. `make figma/src/app/pages/*.tsx`).
 *
 * Ce composant est conservé pour compatibilité historique (imports existants)
 * mais se contente désormais de rendre les enfants tels quels.
 */
const FigmaModuleShell: React.FC<PropsWithChildren<{ view?: string }>> = ({ children }) => {
  return <>{children}</>;
};

export const shouldUseFigmaShellForView = (view: string): boolean => {
  return !['login', 'signup', 'status_selector', 'pending_access', 'no_access'].includes(view);
};

export default FigmaModuleShell;
