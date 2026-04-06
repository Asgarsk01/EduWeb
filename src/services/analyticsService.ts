import { supabase } from '../lib/supabase/client';
import type { 
  ManagementKPIs, 
  ProgramProgress, 
  QuotaDistribution, 
  FunnelMetrics,
  AdmissionVelocity
} from '../types/analytics.types';

export const analyticsService = {
  /**
   * Global KPIs for the Management Dashboard
   */
  async getManagementKPIs(filters?: { academicYearId?: string; campusId?: string; courseLevel?: string }) {
    const { data, error } = await supabase.rpc('get_dashboard_metrics' as any, {
      p_academic_year_id: filters?.academicYearId || null,
      p_campus_id: filters?.campusId || null,
      p_course_level: filters?.courseLevel || null
    });
    if (error) throw error;
    return data as any as ManagementKPIs;
  },

  /**
   * Program-wise seat occupancy and vacancy status
   */
  async getProgramProgress(filters?: { academicYearId?: string; campusId?: string; courseLevel?: string }) {
    let query: any = supabase.from('vw_program_progress' as any).select('*');
    
    if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId);
    if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
    if (filters?.courseLevel && filters.courseLevel !== 'All Levels') {
      const level = filters.courseLevel.includes('UG') ? 'UG' : 'PG';
      query = query.eq('course_level', level);
    }

    const { data, error } = await query.order('program_name');
    if (error) throw error;
    return (data || []) as ProgramProgress[];
  },

  /**
   * Detailed quota breakdown per program
   */
  async getQuotaDistribution(filters?: { academicYearId?: string; campusId?: string; courseLevel?: string }) {
    let query: any = supabase.from('vw_quota_distribution' as any).select('*');

    if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId);
    if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
    if (filters?.courseLevel && filters.courseLevel !== 'All Levels') {
      const level = filters.courseLevel.includes('UG') ? 'UG' : 'PG';
      query = query.eq('course_level', level);
    }

    const { data, error } = await query.order('program_name');
    if (error) throw error;
    return (data || []) as QuotaDistribution[];
  },

  /**
   * Aggregated student counts for the application funnel
   */
  async getFunnelMetrics() {
    const { data, error } = await supabase
        .from('vw_funnel_metrics')
        .select('*');
    if (error) throw error;
    return data as FunnelMetrics[];
  },

  /**
   * Time-series data for admission velocity charts
   */
  async getAdmissionVelocity(academicYearId: string) {
    const { data, error } = await supabase.rpc('get_admission_velocity', {
      p_academic_year_id: academicYearId
    });
    if (error) throw error;
    return data as AdmissionVelocity[];
  }
};
