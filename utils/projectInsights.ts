import type { Project } from '../types';

export type ProjectInsightsCore = {
  progressPercentage: number;
  highRiskCount: number;
  dueInDays: number;
  urgencyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActionEn: string;
  recommendedActionFr: string;
};

/**
 * Score d’urgence / santé projet — même logique que la liste projets (tri « smart »).
 * Les libellés d’action recommandée sont bilingues pour réutilisation cockpit + liste.
 */
export function computeProjectInsights(project: Project): ProjectInsightsCore {
  const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
  const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
  const progressPercentage =
    projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const highRiskCount = (project.risks || []).filter(
    (risk) => risk.impact === 'High' || risk.likelihood === 'High',
  ).length;

  let dueInDays = 9999;
  if (project.dueDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(project.dueDate);
    due.setHours(0, 0, 0, 0);
    dueInDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  }

  const statusPenalty =
    project.status === 'Completed' ? -25 : project.status === 'In Progress' ? 10 : 20;
  const overduePenalty = dueInDays < 0 ? 45 : dueInDays <= 3 ? 25 : dueInDays <= 7 ? 12 : 0;
  const lowProgressPenalty = progressPercentage < 40 ? 15 : progressPercentage < 70 ? 8 : 0;
  const riskPenalty = highRiskCount * 12;

  const urgencyScore = Math.max(
    0,
    Math.min(100, overduePenalty + lowProgressPenalty + riskPenalty + statusPenalty),
  );
  const riskLevel: 'low' | 'medium' | 'high' =
    urgencyScore >= 65 ? 'high' : urgencyScore >= 35 ? 'medium' : 'low';

  let recommendedActionEn: string;
  let recommendedActionFr: string;
  if (dueInDays < 0) {
    recommendedActionEn = 'Escalate now and replan milestones';
    recommendedActionFr = 'Escalader maintenant et replanifier les jalons';
  } else if (highRiskCount > 0) {
    recommendedActionEn = 'Mitigate top risks this week';
    recommendedActionFr = 'Mitiger les risques majeurs cette semaine';
  } else if (progressPercentage < 40) {
    recommendedActionEn = 'Refocus team on priority tasks';
    recommendedActionFr = 'Recentrer l equipe sur les taches prioritaires';
  } else {
    recommendedActionEn = 'Maintain cadence and close blockers';
    recommendedActionFr = 'Maintenir le rythme et lever les blocages';
  }

  return {
    progressPercentage,
    highRiskCount,
    dueInDays,
    urgencyScore,
    riskLevel,
    recommendedActionEn,
    recommendedActionFr,
  };
}
