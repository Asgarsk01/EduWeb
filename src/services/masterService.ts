import { supabase } from '../lib/supabase/client';
import type { 
  InstitutionInsert, CampusInsert, DepartmentInsert, ProgramInsert,
  InstitutionUpdate, CampusUpdate, DepartmentUpdate, ProgramUpdate
} from '../types/master.types';

export const masterService = {
  // Institutions
  async getInstitutions(activeOnly = true) {
    let query = supabase.from('institutions').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    return await query.order('name');
  },

  async createInstitution(data: InstitutionInsert) {
    return await supabase.from('institutions').insert(data).select().single();
  },

  async updateInstitution(id: string, data: InstitutionUpdate) {
    return await supabase.from('institutions').update(data).eq('id', id).select().single();
  },

  // Campuses
  async getCampuses(institutionId?: string, activeOnly = true) {
    let query = supabase.from('campuses').select('*, institutions(name)');
    if (institutionId) query = query.eq('institution_id', institutionId);
    if (activeOnly) query = query.eq('is_active', activeOnly);
    return await query.order('name');
  },

  async createCampus(data: CampusInsert) {
    return await supabase.from('campuses').insert(data).select().single();
  },

  // Departments
  async getDepartments(activeOnly = true) {
    let query = supabase.from('departments').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    return await query.order('name');
  },

  async createDepartment(data: DepartmentInsert) {
    return await supabase.from('departments').insert(data).select().single();
  },

  async updateDepartment(id: string, data: DepartmentUpdate) {
    return await supabase.from('departments').update(data).eq('id', id).select().single();
  },

  // Programs
  async getPrograms(campusId?: string, activeOnly = true) {
    let query = supabase.from('programs').select('*, departments(name), campuses(name)');
    if (campusId) query = query.eq('campus_id', campusId);
    if (activeOnly) query = query.eq('is_active', activeOnly);
    return await query.order('name');
  },

  async createProgram(data: ProgramInsert) {
    return await supabase.from('programs').insert(data).select().single();
  },

  async updateProgram(id: string, data: ProgramUpdate) {
    return await supabase.from('programs').update(data).eq('id', id).select().single();
  },

  async updateCampus(id: string, data: CampusUpdate) {
    return await supabase.from('campuses').update(data).eq('id', id).select().single();
  },

  /**
   * Fetches counts for institutions, campuses, and active users for Admin dashboard.
   */
  async getAdminDashboardSummary() {
    const [inst, camp, dept, users] = await Promise.all([
      supabase.from('institutions').select('id', { count: 'exact', head: true }),
      supabase.from('campuses').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true })
    ]);

    return {
      institutions: inst.count || 0,
      campuses: camp.count || 0,
      departments: dept.count || 0,
      users: users.count || 0
    };
  },

  // Academic Years
  async getAcademicYears() {
    const { data, error } = await supabase.from('academic_years').select('*').order('year_string', { ascending: false });
    if (error) throw error;
    return data;
  }
};
