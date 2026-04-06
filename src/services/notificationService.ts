import { supabase } from '../lib/supabase/client';

export interface Notification {
  id: string;
  actor_id: string | null;
  target_roles: string[];
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  created_at: string;
  is_read: boolean;
}

export const notificationService = {
  /**
   * Fetches all notifications relevant to the current user's role,
   * with read/unread status included via the database view.
   */
  async getMyNotifications(): Promise<{ data: Notification[]; error: unknown }> {
    const { data, error } = await supabase
      .from('vw_my_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return { data: (data as Notification[]) || [], error };
  },

  /**
   * Marks a single notification as read for the current user.
   */
  async markAsRead(notificationId: string): Promise<{ error: unknown }> {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });
    return { error };
  },

  /**
   * Marks ALL unread notifications as read for the current user.
   */
  async markAllAsRead(): Promise<{ error: unknown }> {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    return { error };
  },

  /**
   * Subscribes to real-time inserts on system_notifications.
   * Returns an unsubscribe function for cleanup.
   */
  subscribeToNewNotifications(callback: (payload: any) => void) {
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
