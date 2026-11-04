import api from './index'

export const userApi = {
  login: (username: string, password: string) =>
    api.post('/users/login', { username, password }),

  register: (username: string, password: string, realName: string) =>
    api.post('/users/register', { username, password, realName }),

  getById: (id: string) => api.get(`/users/${id}`),

  list: (type?: string) => api.get('/users', { params: { type } }),

  getStats: () => api.get('/users/stats'),

  updateType: (id: string, userType: string) =>
    api.put(`/users/${id}/type`, { userType }),

  updateSettings: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}/settings`, data),
}

export const taskApi = {
  getDaily: (userId: string, date?: string) =>
    api.get(`/tasks/daily/${userId}`, { params: { date } }),

  getById: (id: string) => api.get(`/tasks/${id}`),

  create: (data: Record<string, unknown>) => api.post('/tasks', data),

  complete: (id: string) => api.post(`/tasks/${id}/complete`),

  getSubtasks: (taskId: string) => api.get(`/tasks/${taskId}/subtasks`),

  createSubtask: (taskId: string, data: Record<string, unknown>) =>
    api.post(`/tasks/${taskId}/subtasks`, data),

  completeSubtask: (id: string) => api.post(`/tasks/subtasks/${id}/complete`),

  getStats: (userId: string) => api.get(`/tasks/stats/${userId}`),
}

export const notificationApi = {
  getHistory: (userId: string) => api.get(`/notifications/history/${userId}`),
  getUnread: (userId: string) => api.get(`/notifications/unread/${userId}`),
  getStats: (userId: string) => api.get(`/notifications/stats/${userId}`),
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data: Record<string, unknown>) => api.post('/notifications/templates', data),
}

export const abtestApi = {
  listExperiments: () => api.get('/abtest/experiments'),
  getExperiment: (id: number) => api.get(`/abtest/experiments/${id}`),
  createExperiment: (data: Record<string, string>) => api.post('/abtest/experiments', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/abtest/experiments/${id}/status`, { status }),
  getGroups: (id: number) => api.get(`/abtest/experiments/${id}/groups`),
  createGroup: (id: number, data: Record<string, unknown>) =>
    api.post(`/abtest/experiments/${id}/groups`, data),
  getReport: (id: number) => api.get(`/abtest/experiments/${id}/report`),
  assign: (userId: string, experimentId: number) =>
    api.post('/abtest/assign', { userId, experimentId }),
  deleteExperiment: (id: number) => api.delete(`/abtest/experiments/${id}`),
}

export const dashboardApi = {
  getTrend: () => api.get('/dashboard/trend'),
  getTimeline: () => api.get('/dashboard/timeline'),
}

export const engineApi = {
  simulate: (userId: string) => api.post(`/engine/simulate/${userId}`),
}

export const eventApi = {
  record: (userId: string, eventType: string, eventData?: Record<string, unknown>) =>
    api.post('/events', { userId, eventType, eventData }),
}
