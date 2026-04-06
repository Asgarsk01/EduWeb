import { supabase } from '../lib/supabase/client';
import type { 
  AcademicYearInsert, DocumentMasterInsert, SeatMatrixInsert,
  AcademicYearUpdate, SeatMatrixUpdate
} from '../types/rulebook.types';

export const rulebookService = {
  // Academic Years
  async getAcademicYears() {
    return await supabase.from('academic_years').select('*').order('year_string', { ascending: false });
  },

  async getActiveAcademicYear() {
    return await supabase.from('academic_years').select('*').eq('is_active', true).maybeSingle();
  },

  async createAcademicYear(data: AcademicYearInsert) {
    return await supabase.from('academic_years').insert(data).select().single();
  },

  async updateAcademicYear(id: string, data: AcademicYearUpdate) {
    return await supabase.from('academic_years').update(data).eq('id', id).select().single();
  },

  async activateAcademicYear(id: string) {
    // 1. Deactivate all
    await supabase.from('academic_years').update({ is_active: false }).neq('id', id);
    // 2. Activate one
    return await supabase.from('academic_years').update({ is_active: true }).eq('id', id).select().single();
  },

  // Document Masters
  async getDocumentMasters(activeOnly = true) {
    let query = supabase.from('document_masters').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    return await query.order('name');
  },

  async createDocumentMaster(data: DocumentMasterInsert) {
    return await supabase.from('document_masters').insert(data).select().single();
  },

  async updateDocumentMaster(id: string, data: Partial<DocumentMasterInsert>) {
    return await supabase.from('document_masters').update(data).eq('id', id).select().single();
  },

  async deleteDocumentMaster(id: string) {
    return await supabase.from('document_masters').delete().eq('id', id);
  },

  // Seat Matrices
  async getSeatMatrices(filters?: { academicYearId?: string, campusId?: string, departmentId?: string }) {
    let query = supabase.from('seat_matrices').select(`
      *,
      programs!inner (
        id,
        name,
        code,
        campus_id,
        department_id,
        campuses (name)
      )
    `);
    
    if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId);
    if (filters?.campusId) query = query.eq('programs.campus_id', filters.campusId);
    if (filters?.departmentId) query = query.eq('programs.department_id', filters.departmentId);
    
    return await query;
  },

  async createSeatMatrix(data: SeatMatrixInsert) {
    return await supabase.from('seat_matrices').insert(data).select().single();
  },

  async updateSeatMatrix(id: string, data: SeatMatrixUpdate) {
    return await supabase.from('seat_matrices').update(data).eq('id', id).select().single();
  }
};
