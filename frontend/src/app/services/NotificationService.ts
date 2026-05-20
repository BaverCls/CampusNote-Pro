import { authFetch } from './AuthService';
import { API_URL } from './config';

export interface AppNotification {
  id: number;
  documentId?: number | null;
  type: string;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt?: string | null;
}

export const NotificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    const response = await authFetch(`${API_URL}/notifications`, {
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getUnreadCount(): Promise<number> {
    const response = await authFetch(`${API_URL}/notifications/unread-count`, {
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json() as { count?: number };
    return payload.count ?? 0;
  },

  async markAsRead(id: number): Promise<AppNotification> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid notification id');
    }
    const response = await authFetch(`${API_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async markAllAsRead(): Promise<number> {
    const response = await authFetch(`${API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json() as { updated?: number };
    return payload.updated ?? 0;
  },
};
