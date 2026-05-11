import React, { createContext, useContext, type ReactNode } from 'react';
import type { Project } from '../../types';
import type { ProjectCockpitReadModel } from '../../services/projectCockpitReadModel';
import type { ProjectWorkspaceTab } from '../../components/project/workspace/types';

export type ProjectWorkspaceContextValue = {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  workspaceTab: ProjectWorkspaceTab;
  setWorkspaceTab: React.Dispatch<React.SetStateAction<ProjectWorkspaceTab>>;
  cockpitReadModel: ProjectCockpitReadModel;
  canManageProject: boolean;
  canGovernTasks: boolean;
  isFr: boolean;
  organizationId: string | null;
  userId: string | null;
  onUpdateProject: (project: Project) => void;
};

const ProjectWorkspaceContext = createContext<ProjectWorkspaceContextValue | null>(null);

export type ProjectWorkspaceProviderProps = {
  value: ProjectWorkspaceContextValue;
  children: ReactNode;
};

export const ProjectWorkspaceProvider: React.FC<ProjectWorkspaceProviderProps> = ({ value, children }) => (
  <ProjectWorkspaceContext.Provider value={value}>{children}</ProjectWorkspaceContext.Provider>
);

export function useProjectWorkspace(): ProjectWorkspaceContextValue {
  const ctx = useContext(ProjectWorkspaceContext);
  if (!ctx) {
    throw new Error('useProjectWorkspace doit être utilisé sous ProjectWorkspaceProvider');
  }
  return ctx;
}
