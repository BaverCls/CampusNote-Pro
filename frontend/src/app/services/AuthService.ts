const API_URL = 'http://localhost:8080/api';

export interface User {
  id: number;
  email: string;
  fullName?: string;
  coinBalance: number;
  role: 'STUDENT' | 'ADMIN';
}

export const AuthService = {
  async register(email: string, password: string, fullName: string):Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      
      const data = await response.text();
      
      if (!response.ok) {
        return { success: false, message: data || 'Registration failed' };
      }
      
      return { success: true, message: data };
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  },

  async login(email: string, password: string):Promise<{success: boolean, user?: User, message?: string}> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      const payload = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        return {
          success: false,
          message: typeof payload === 'string' ? payload : 'Login failed',
        };
      }

      const user = payload as User;
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  },

  async refreshUser() {
    const user = this.getCurrentUser();
    if (!user) return;

    const { UserService } = await import('./UserService');
    const freshData = await UserService.getProfile();
    if (freshData) {
      const updatedUser = { ...user, ...freshData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Dispatch a custom event to notify components like Header/Sidebar
      window.dispatchEvent(new Event('user-data-updated'));
    }
  },

  logout() {
    fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
};
