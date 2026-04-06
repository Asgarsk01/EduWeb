import { supabase } from '../lib/supabase/client';
import type { UserProfile } from '../types/auth.types';
import type { User } from '@supabase/supabase-js';

export const authService = {
  /**
   * Fetches the profile for a given user ID.
   */
  async getProfile(userId: string): Promise<{ data: UserProfile | null, error: unknown }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, campuses(name)')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as UserProfile, error: null };
  },

  // Internal state to deduplicate concurrent requests
  _currentUserPromise: null as Promise<{ user: User | null, profile: UserProfile | null, error: unknown }> | null,

  /**
   * Fetches the current user and their profile.
   * Deduplicates concurrent calls to prevent Supabase Auth lock contention.
   */
  async getCurrentUser(): Promise<{ user: User | null, profile: UserProfile | null, error: unknown }> {
    if (this._currentUserPromise) {
      return this._currentUserPromise;
    }

    this._currentUserPromise = (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          return { user: null, profile: null, error: userError };
        }

        const { data: profile, error: profileError } = await authService.getProfile(user.id);
        
        // Block suspended users immediately
        if (profile?.status === 'SUSPENDED') {
          await supabase.auth.signOut();
          return { user: null, profile: null, error: new Error('Your account has been suspended. Please contact the administrator.') };
        }

        return { user, profile, error: profileError };
      } catch (err: any) {
        // Handle the Supabase lock/abort error gracefully
        if (err.message?.includes('Lock') || err.name === 'AbortError') {
          console.warn('Auth lock contention handled: retrying with local session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
             const { data: profile } = await authService.getProfile(session.user.id);
             
             if (profile?.status === 'SUSPENDED') {
               await supabase.auth.signOut();
               return { user: null, profile: null, error: new Error('Account suspended.') };
             }

             return { user: session.user, profile, error: null };
          }
        }
        return { user: null, profile: null, error: err };
      } finally {
        setTimeout(() => { this._currentUserPromise = null; }, 1000);
      }
    })();

    return this._currentUserPromise;
  },

  /**
   * Administrative: Fetches all user profiles.
   */
  async getUsers() {
    return await supabase
      .from('user_profiles')
      .select('*, campuses(name)')
      .order('full_name');
  },

  /**
   * Administrative: Updates a user's profile (role, status, campus).
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    return await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();
  },

  async deleteUser(userId: string) {
    // Deprecated for standard staff revocation to avoid breaking foreign key constraints.
    // Use updateUserProfile(id, { status: 'SUSPENDED' }) instead.
    return await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
  },

  async signIn(email: string, password: string): Promise<{ user: User | null, profile: UserProfile | null, error: any }> {
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !user) {
      return { user: null, profile: null, error: authError };
    }

    const { data: profile, error: profileError } = await authService.getProfile(user.id);

    // Enforcement: Reject login for suspended accounts
    if (profile?.status === 'SUSPENDED') {
       await supabase.auth.signOut();
       return { user: null, profile: null, error: new Error('This account has been deactivated. Access is denied.') };
    }

    return { user, profile, error: profileError };
  },

  /**
   * Signs out the current user.
   */
  async signOut(): Promise<{ error: unknown }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Invokes the Edge Function to provision a new user.
   */
  async provisionUser(payload: { 
    email: string, 
    full_name: string, 
    role: string, 
    campus_id: string | null,
    id_number: string,
    dob: string
  }) {
    const { data, error } = await supabase.functions.invoke('provision-user', {
      body: payload
    });
    
    if (error) {
       // Supabase JS 'FunctionsError' might have the body text/data
       try {
          const body = (error as any).data || await (error as any).context?.json();
          if (body?.error) return { data: null, error: new Error(body.error) };
       } catch (e) {}
    }
    
    return { data, error };
  }
};
