export type {
  ActivityEvent,
  ActivityEventInput,
  ActivityEventIntegrity,
  ActivityEventPayload,
  ActivityVerb,
  WorkforceDimension,
  WorkforceObjectRef,
} from './types/workforceEvents';

export type {
  ActivityTimelineSegmentKind,
  DailyWorkforceRollupConcept,
  DeviceSessionRef,
  OperationalContext,
  WorkforceInterpretationHypothesis,
} from './types/sessionTimelineModel';

export {
  ActivityEventEngine,
  ChainedActivityEventPersistence,
  configureDefaultActivityEventPersistence,
  emitActivityEvent,
  InMemoryActivityEventPersistence,
  normalizeActivityEvent,
  NoopActivityEventPersistence,
  resetDefaultActivityEventEngineForTests,
  subscribeActivityEvents,
} from './activityEventEngine';

export type { ActivityEventPersistence } from './activityEventEngine';

export { getCurrentUserOrgContext } from './supabaseWorkforceContext';
export type { WorkforceSupabaseUserContext } from './supabaseWorkforceContext';

export { SupabaseTimelineSegmentPersistence } from './supabaseTimelineSegmentPersistence';

export { segmentKindFromActivityVerb } from './activityEventToTimelineMapping';

export {
  consolidateBySegmentKind,
  consolidateIsoSegments,
  mergeOverlappingIntervals,
  totalDurationMs,
} from './sessionConsolidationEngine';
export type { TimeIntervalMs } from './sessionConsolidationEngine';

export { emitPresenceActivityEvents } from './presenceActivityBridge';
export type { PresenceTransitionContext } from './presenceActivityBridge';

export { emitTimeLogImputationEvent } from './timeLogActivityBridge';

export { SupabaseActivityEventPersistence } from './supabaseActivityEventPersistence';

export { emitTaskCompletedWorkforce } from './taskActivityBridge';
