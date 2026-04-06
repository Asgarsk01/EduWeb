import type { Database } from './database.types';

export type AcademicYear = Database['public']['Tables']['academic_years']['Row'];
export type DocumentMaster = Database['public']['Tables']['document_masters']['Row'];
export type SeatMatrix = Database['public']['Tables']['seat_matrices']['Row'];

export type AcademicYearInsert = Database['public']['Tables']['academic_years']['Insert'];
export type DocumentMasterInsert = Database['public']['Tables']['document_masters']['Insert'];
export type SeatMatrixInsert = Database['public']['Tables']['seat_matrices']['Insert'];

export type AcademicYearUpdate = Database['public']['Tables']['academic_years']['Update'];
export type DocumentMasterUpdate = Database['public']['Tables']['document_masters']['Update'];
export type SeatMatrixUpdate = Database['public']['Tables']['seat_matrices']['Update'];
