import type { Database } from './database.types';

export interface ManagementKPIs {
  total_capacity: number;
  total_admitted: number;
  fee_collection_ratio: number;
  clearance_ratio: number;
}

export interface ProgramProgress {
  program_id: string;
  program_name: string;
  campus_id: string;
  course_level: string;
  academic_year_id: string;
  total_seats: number;
  confirmed_seats: number;
  reserved_seats: number;
  vacant_seats: number;
}

export interface QuotaDistribution {
  program_id: string;
  program_name: string;
  campus_id: string;
  course_level: string;
  academic_year_id: string;
  kcet_quota: number;
  kcet_filled: number;
  comedk_quota: number;
  comedk_filled: number;
  management_quota: number;
  management_filled: number;
}

export type FunnelMetrics = Database['public']['Views']['vw_funnel_metrics']['Row'];

export interface AdmissionVelocity {
  admission_date: string;
  confirmed_count: number;
}
