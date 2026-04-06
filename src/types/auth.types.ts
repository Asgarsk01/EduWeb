import type { Database } from './database.types';

export type UserRole = Database['public']['Enums']['user_role'];
export type UserStatus = Database['public']['Enums']['user_status'];

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  campus_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Type alias for auth context — extends UserProfile with any auth-specific fields in the future
export type AuthUser = UserProfile;
