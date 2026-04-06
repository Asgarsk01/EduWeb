import type { Database, Json } from './database.types';

export type ProblemArea = Database['public']['Views']['vw_problem_areas']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface LogActionParams {
  applicantId: string;
  actionType: 'REMINDER_SENT' | 'SEAT_WITHDRAWN' | 'APP_CANCELLED' | 'STATUS_CHANGED';
  bottleneckType?: string;
  details?: Json;
}
