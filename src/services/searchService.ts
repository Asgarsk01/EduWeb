import { supabase } from '../lib/supabase/client';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  item_type: string;
  route: string;
}

export const searchService = {
  /**
   * Executes a global search across applicants, programs, and system entities.
   * Logic is role-aware and handled in the database RPC.
   */
  async executeGlobalSearch(query: string): Promise<{ data: SearchResult[] | null, error: any }> {
    if (!query || query.length < 2) {
      return { data: [], error: null };
    }

    const { data: rawData, error } = await supabase.rpc('global_crm_search' as any, { 
      p_search_query: query 
    });

    if (error) return { data: null, error };

    // RPC returns result_id, result_title, result_subtitle, result_item_type, result_route
    const results: SearchResult[] = (rawData as any[]).map(row => ({
      id: row.result_id,
      title: row.result_title,
      subtitle: row.result_subtitle,
      item_type: row.result_item_type,
      route: row.result_route
    }));

    return { data: results, error: null };
  }
};
