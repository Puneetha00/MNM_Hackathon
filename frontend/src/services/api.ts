const API_BASE = 'https://mnm-hackathon-web.onrender.com/api/v1';

export function getAuthToken(): string | null {
  const token = localStorage.getItem('eldercare_token');

  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }

  return token;
}

export function setAuthToken(token: string): void {
  localStorage.setItem('eldercare_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('eldercare_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Only redirect if not on login or register or passcode verify
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register' && path !== '/' && !path.startsWith('/verify-passcode')) {
      removeAuthToken();
      window.location.href = '/login?expired=true';
    }
  }

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle empty or file responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: (role: string) => request<any>(`/auth/demo-login/${role}`, { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updateMe: (data: any) => request<any>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  verifyPasscode: (passcode: string) => request<any>('/auth/verify-passcode', { method: 'POST', body: JSON.stringify({ passcode }) }),

  // Health Profile & Wellness
  getHealthProfile: (elderlyId?: number) => request<any>(`/users/health-profile${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  updateHealthProfile: (data: any, elderlyId?: number) => request<any>(`/users/health-profile${elderlyId ? `?elderly_id=${elderlyId}` : ''}`, { method: 'PUT', body: JSON.stringify(data) }),
  getTodayWellness: (elderlyId?: number) => request<any>(`/users/wellness/today${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  updateTodayWellness: (data: any, elderlyId?: number) => request<any>(`/users/wellness/today${elderlyId ? `?elderly_id=${elderlyId}` : ''}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendVoiceCommand: (command: string) => request<any>('/users/voice-command', { method: 'POST', body: JSON.stringify({ command }) }),

  // Medications & Adherence
  getMedications: (elderlyId?: number) => request<any[]>(`/medications${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  createMedication: (data: any) => request<any>('/medications', { method: 'POST', body: JSON.stringify(data) }),
  updateMedication: (id: number, data: any) => request<any>(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedication: (id: number) => request<any>(`/medications/${id}`, { method: 'DELETE' }),
  getTodaySchedule: (elderlyId?: number, date?: string) => {
    const params = new URLSearchParams();
    if (elderlyId) params.append('elderly_id', elderlyId.toString());
    if (date) params.append('target_date', date);
    return request<any[]>(`/medications/schedule/today?${params.toString()}`);
  },
  markDoseStatus: (doseId: number, status: string, notes?: string) => 
    request<any>(`/medications/dose/${doseId}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  getAdherenceSummary: (elderlyId?: number, days = 14) => 
    request<any>(`/adherence/summary?days=${days}${elderlyId ? `&elderly_id=${elderlyId}` : ''}`),

  // Appointments
  getAppointments: (elderlyId?: number, statusFilter?: string) => {
    const params = new URLSearchParams();
    if (elderlyId) params.append('elderly_id', elderlyId.toString());
    if (statusFilter) params.append('status_filter', statusFilter);
    return request<any[]>(`/appointments?${params.toString()}`);
  },
  createAppointment: (data: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id: number, data: any) => request<any>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAppointment: (id: number) => request<any>(`/appointments/${id}`, { method: 'DELETE' }),

  // Medical Records Vault
  getMedicalRecords: (elderlyId?: number, type?: string) => {
    const params = new URLSearchParams();
    if (elderlyId) params.append('elderly_id', elderlyId.toString());
    if (type) params.append('record_type', type);
    return request<any[]>(`/records?${params.toString()}`);
  },
  uploadMedicalRecord: (formData: FormData) => request<any>('/records/upload', { method: 'POST', body: formData }),
  deleteMedicalRecord: (id: number) => request<any>(`/records/${id}`, { method: 'DELETE' }),
  getRecordDownloadUrl: (id: number) => `${API_BASE}/records/${id}/download`,

  // Caregiver & Family Dashboards
  getCaregiverDashboard: () => request<any>('/caregiver/dashboard'),
  getFamilyDashboard: (elderlyId?: number) => request<any>(`/family/dashboard${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  getCollaborators: (elderlyId?: number) => request<any[]>(`/family/members${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  createInvitation: (data: any) => request<any>('/family/invite', { method: 'POST', body: JSON.stringify(data) }),
  acceptInvitation: (data: any) => request<any>('/family/accept', { method: 'POST', body: JSON.stringify(data) }),
  updatePermissions: (linkId: number, data: any) => request<any>(`/family/permissions/${linkId}`, { method: 'PUT', body: JSON.stringify(data) }),
  revokeAccess: (linkId: number) => request<any>(`/family/permissions/${linkId}`, { method: 'DELETE' }),

  // Emergency Assistance
  getEmergencyCard: (elderlyId?: number) => request<any>(`/emergency/card${elderlyId ? `?elderly_id=${elderlyId}` : ''}`),
  triggerEmergency: (notes?: string) => request<any>('/emergency/trigger', { method: 'POST', body: JSON.stringify({ notes }) }),

  // Notifications
  getNotifications: (unreadOnly = false) => request<any>(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
  triggerTestReminder: () => request<any>('/notifications/test-trigger', { method: 'POST' }),

  // Security & Admin
  getAuditLogs: (limit = 50) => request<any[]>(`/security/audit-logs?limit=${limit}`),
  exportUserData: () => request<any>('/security/export-data'),
  deleteAccount: () => request<any>('/security/account', { method: 'DELETE' }),
  getAdminMetrics: () => request<any>('/admin/metrics'),
  getAdminUsers: (role?: string) => request<any[]>(`/admin/users${role ? `?role=${role}` : ''}`),
  getAdminAuditLogs: (category?: string) => request<any[]>(`/admin/audit-logs${category ? `?category=${category}` : ''}`),
};
