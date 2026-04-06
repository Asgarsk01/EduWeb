import type { UserRole } from './auth.types';
import type { Tables } from './database.types';

export type AIFeeAging = Tables<'vw_ai_fee_aging'>;
export type DailyMetricSnapshot = Tables<'daily_metric_snapshots'>;
export type ManagementKPIContext = Tables<'vw_management_kpis'>;
export type ProgramProgressContext = Tables<'vw_program_progress'>;
export type FunnelMetricContext = Tables<'vw_funnel_metrics'>;
export type AcademicYearContext = Tables<'academic_years'>;
export type DocumentMasterContext = Pick<
  Tables<'document_masters'>,
  'id' | 'name' | 'quota_req' | 'course_level_req' | 'is_mandatory'
>;

export interface AdminContext {
  activeAcademicYear: AcademicYearContext | null;
  physicalScale: {
    institutions: number;
    campuses: number;
    departments: number;
  };
  documentRequirements: DocumentMasterContext[];
  activeStaffByRole: Record<UserRole, number>;
}

export interface OfficerContext {
  bottlenecksByCategory: Record<string, number>;
  funnelMetrics: FunnelMetricContext[];
}

export interface ManagementContext {
  kpis: ManagementKPIContext | null;
  programProgress: ProgramProgressContext[];
  feeAging: AIFeeAging | null;
}

export interface CompiledSystemContext {
  adminContext: AdminContext;
  officerContext: OfficerContext;
  managementContext: ManagementContext;
  historicalContext: DailyMetricSnapshot[];
}

export interface CompiledSystemContextPayload {
  context: CompiledSystemContext;
  contextJson: string;
  durationMs: number;
}

export interface AICopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'done' | 'streaming' | 'error';
}
