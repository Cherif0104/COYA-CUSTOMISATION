import React, { useState } from 'react';
import AccountingModuleShell from './accounting/AccountingModuleShell';
import ComptabiliteModuleLegacy from './accounting/ComptabiliteModuleLegacy';

/**
 * Module Comptabilité — point d’entrée unique :
 * - Vue moderne (`AccountingModuleShell`) pour la plupart des usages.
 * - Vue avancée (`ComptabiliteModuleLegacy`) pour les fonctionnalités expertes.
 */
const ComptabiliteModule: React.FC = () => {
  const [mode, setMode] = useState<'modern' | 'legacy'>('modern');

  if (mode === 'legacy') {
    return <ComptabiliteModuleLegacy onBackToModern={() => setMode('modern')} />;
  }

  return <AccountingModuleShell onOpenLegacy={() => setMode('legacy')} />;
};

export default ComptabiliteModule;
