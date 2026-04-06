import type { Database } from './database.types';

export type Institution = Database['public']['Tables']['institutions']['Row'];
export type Campus = Database['public']['Tables']['campuses']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Program = Database['public']['Tables']['programs']['Row'];

export type InstitutionInsert = Database['public']['Tables']['institutions']['Insert'];
export type CampusInsert = Database['public']['Tables']['campuses']['Insert'];
export type DepartmentInsert = Database['public']['Tables']['departments']['Insert'];
export type ProgramInsert = Database['public']['Tables']['programs']['Insert'];

export type InstitutionUpdate = Database['public']['Tables']['institutions']['Update'];
export type CampusUpdate = Database['public']['Tables']['campuses']['Update'];
export type DepartmentUpdate = Database['public']['Tables']['departments']['Update'];
export type ProgramUpdate = Database['public']['Tables']['programs']['Update'];
