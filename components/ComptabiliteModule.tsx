import React from 'react';
import AccountingModuleShell from './accounting/AccountingModuleShell';

/**
 * Module Comptabilité — point d’entrée unique : `AccountingModuleShell` (navigation groupée, journal par défaut en données live).
 */
const ComptabiliteModule: React.FC = () => <AccountingModuleShell />;

export default ComptabiliteModule;
