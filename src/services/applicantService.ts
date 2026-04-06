import { supabase } from '../lib/supabase/client';
import type { 
  ApplicantStatus,
  ApplicantInsert, 
  ApplicantDocumentInsert, 
  ApplicantUpdate, 
  ApplicantFeeUpdate
} from '../types/applicant.types';

export const applicantService = {
  // Applicants
  async getApplicants(filters?: { status?: ApplicantStatus, campusId?: string }) {
    let query = supabase.from('applicants').select(`
      *,
      programs (name, code),
      campuses (name)
    `);
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.campusId) query = query.eq('campus_id', filters.campusId);
    
    return await query.order('created_at', { ascending: false });
  },

  async getApplicantById(id: string) {
    return await supabase.from('applicants').select(`
      *,
      programs (*),
      campuses (*),
      applicant_documents (*, document_masters (*)),
      applicant_fees (*)
    `).eq('id', id).single();
  },

  async createApplicant(data: ApplicantInsert) {
    return await supabase.from('applicants').insert(data).select().single();
  },

  async updateApplicant(id: string, data: ApplicantUpdate) {
    return await supabase.from('applicants').update(data).eq('id', id).select().single();
  },

  // Applicant Documents
  async updateDocumentStatus(id: string, status: 'PENDING' | 'VERIFIED') {
    return await supabase.from('applicant_documents').update({ status }).eq('id', id).select().single();
  },

  async bulkCreateDocuments(documents: { applicant_id: string, document_master_id: string }[]) {
    return await supabase.from('applicant_documents').insert(documents);
  },

  async uploadDocument(data: ApplicantDocumentInsert) {
    return await supabase.from('applicant_documents').insert(data).select().single();
  },

  // Applicant Fees
  async createFeeRecord(applicantId: string, amount: number = 0) {
    return await supabase.from('applicant_fees').insert({
      applicant_id: applicantId,
      amount: amount,
      status: 'PENDING'
    }).select().single();
  },

  async recordFeePayment(id: string, data: Partial<ApplicantFeeUpdate>) {
    return await supabase.from('applicant_fees').update({
      ...data,
      status: 'PAID',
      paid_at: new Date().toISOString()
    }).eq('id', id).select().single();
  },

  // Final Confirmation RPC
  async confirmAdmission(applicantId: string) {
    const { data, error } = await supabase.rpc('confirm_admission', { 
      p_applicant_id: applicantId 
    });
    
    if (error) throw error;
    return data as { success: boolean; admission_number?: string; message: string };
  }
};
