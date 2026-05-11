import React from 'react';
import { EmptyState } from '../ui/EmptyState';

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Accès refusé',
  description = 'Vous n’avez pas les permissions nécessaires pour accéder à ce module. Veuillez contacter votre administrateur.',
}) => {
  return (
    <div className="min-h-screen bg-coya-bg flex items-center justify-center p-6 font-coya">
      <div className="w-full max-w-lg">
        <EmptyState
          title={title}
          description={description}
          icon={<i className="fas fa-lock" aria-hidden />}
        />
      </div>
    </div>
  );
};

export default AccessDenied;


