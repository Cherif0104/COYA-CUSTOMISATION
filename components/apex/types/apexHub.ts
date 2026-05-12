import type { CourseSessionStatus } from '../../../types';

export type ApexCohortRow = {
  courseId: string;
  courseTitle: string;
  sessionId: string;
  sessionTitle: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status: CourseSessionStatus;
  enrollmentCount: number;
};

export type ApexReportMetrics = {
  publishedCount: number;
  sessionsCount: number;
  totalSessionEnrollments: number;
  coveragePct: number;
  avgSessionEnrollments: number;
  totalCourseEnrollments: number;
};
