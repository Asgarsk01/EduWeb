import type { Database } from './database.types';

export type ApplicantStatus = Database['public']['Enums']['applicant_status'];
export type Applicant = Database['public']['Tables']['applicants']['Row'];
export type ApplicantDocument = Database['public']['Tables']['applicant_documents']['Row'];
export type ApplicantFee = Database['public']['Tables']['applicant_fees']['Row'];

export type ApplicantInsert = Database['public']['Tables']['applicants']['Insert'];
export type ApplicantDocumentInsert = Database['public']['Tables']['applicant_documents']['Insert'];
export type ApplicantFeeInsert = Database['public']['Tables']['applicant_fees']['Insert'];

export type ApplicantUpdate = Database['public']['Tables']['applicants']['Update'];
export type ApplicantDocumentUpdate = Database['public']['Tables']['applicant_documents']['Update'];
export type ApplicantFeeUpdate = Database['public']['Tables']['applicant_fees']['Update'];
