import { supabase } from '../lib/supabase/client';
import type { LogActionParams } from '../types/problem.types';

export const problemService = {
  /**
   * Fetches the pre-calculated problem areas from the database view.
   * This view identifies applicants with overdue fees, missing docs, or stale applications.
   */
  async getProblemAreas() {
    return await supabase
      .from('vw_problem_areas')
      .select('*')
      .order('days_pending', { ascending: false });
  },

  /**
   * Fetches audit logs for a specific applicant.
   */
  async getApplicantLogs(applicantId: string) {
    return await supabase
      .from('audit_logs')
      .select('*')
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false });
  },

  /**
   * Logs an officer's action via RPC.
   * This ensures officer_id is automatically captured from the auth context.
   */
  async logAction(params: LogActionParams) {
    const { error } = await supabase.rpc('log_officer_action', {
      p_applicant_id: params.applicantId,
      p_action_type: params.actionType,
      p_bottleneck_type: params.bottleneckType ?? undefined,
      p_details: params.details ?? undefined
    });

    if (error) throw error;
  }
};
