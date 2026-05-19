import { API_URL } from './config';

export interface User {
  id: number;
  email: string;
  fullName?: string;
  coinBalance: number;
  role: 'STUDENT' | 'ADMIN';
  bio?: string;
  university?: string;
  facultyId?: number;
  departmentId?: number;
  departmentName?: string;
  facultyName?: string;
  year?: number;
  token?: string;
}

type ApiErrorPayload = { error?: string; message?: string; details?: string };

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as ApiErrorPayload;
      return payload.error || payload.message || payload.details || fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Global fetch wrapper that handles 401 (session expired) automatically.
 * When any API call returns 401, it clears localStorage and redirects to /login.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const currentUser = AuthService.getCurrentUser();
  const token = currentUser?.token;
  const mergedHeaders = new Headers(options.headers || {});
  if (token && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include',
  });

  if (response.status === 401) {
    const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
    
    if (!isAuthPage) {
      console.warn(`Session expired (401) on URL: ${url}. Redirecting to login...`);
      localStorage.removeItem('user');
      // Use a small delay to ensure the state is cleared before redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      throw new Error('SESSION_EXPIRED');
    }
  }

  return response;
}

export const AuthService = {
  async register(email: string, password: string, fullName: string, facultyId: number, departmentId: number, year: number): Promise<{success: boolean, message: string}> {
    if (!Number.isInteger(facultyId) || !Number.isInteger(departmentId) || facultyId <= 0 || departmentId <= 0 || !Number.isInteger(year) || year < 1 || year > 4) {
      return { success: false, message: 'Invalid registration details' };
    }
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, facultyId, departmentId, year }),
      });
      
      if (!response.ok) {
        return { success: false, message: await readErrorMessage(response, 'Registration failed') };
      }
      const payload = await response.json().catch(() => ({} as { message?: string }));
      return { success: true, message: payload.message || 'User registered successfully' };
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  },

  async login(email: string, password: string): Promise<{success: boolean, user?: User, message?: string}> {
    try {
      // FR-ST-01: The system shall authenticate users using an "@arel.edu.tr" email domain
      // FR-ST-02: The system shall deny login attempts containing incorrect credentials
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return {
          success: false,
          message: await readErrorMessage(response, 'Login failed'),
        };
      }

      const user = await response.json() as User;
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      return { success: false, message: 'Login failed due to connection error' };
    }
  },

  async refreshUser() {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      const { UserService } = await import('./UserService');
      const freshData = await UserService.getProfile();
      if (freshData) {
        const updatedUser = { ...user, ...freshData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-data-updated'));
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_EXPIRED') return;
      console.error('Refresh user error:', e);
    }
  },

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (response.ok) return { success: true };
      return { success: false, message: await response.text() };
    } catch {
      return { success: false, message: 'Network error' };
    }
  },

  logout() {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-data-updated'));

    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    }).catch((error) => {
      console.error('Logout request failed:', error);
    });

    window.location.replace('/login');
  },

  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
};
