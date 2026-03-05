import axios from 'axios'

const api = axios.create({ baseURL: '/v1' })

// 自动注入 token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// 401 时清除登录态
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

/* ── Auth ── */
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
}

/* ── Diaries ── */
export const diaryApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    api.get('/diaries', { params }),
  get: (id: number) => api.get(`/diaries/${id}`),
  create: (data: {
    content: string
    diaryDate: string
    title?: string
    emotionTags?: string[]
    importanceScore?: number
  }) => api.post('/diaries', data),
  update: (id: number, data: Partial<{ title: string; content: string; emotionTags: string[]; importanceScore: number }>) =>
    api.put(`/diaries/${id}`, data),
  delete: (id: number) => api.delete(`/diaries/${id}`),
}

/* ── Users ── */
export const userApi = {
  getProfile: (userId: number) => api.get(`/users/${userId}/profile`),
  updateProfile: (userId: number, data: Record<string, unknown>) =>
    api.put(`/users/${userId}/profile`, data),
  getStats: (userId: number) => api.get(`/users/${userId}/stats`),
}

/* ── AI Analysis ── */
export const analysisApi = {
  create: (diaryId: number) => api.post(`/diaries/${diaryId}/analyze`, {}),
  list: (diaryId?: number) => api.get('/analyses', { params: { diaryId } }),
  get: (id: number) => api.get(`/analyses/${id}`),
}

/* ── Social Posts ── */
export const socialApi = {
  generate: (data: { diaryId?: number; content: string; style: string; catchphrases?: string[] }) =>
    api.post('/social/generate', data),
  save: (data: { diaryId?: number; content: string; style: string }) =>
    api.post('/social', data),
  list: () => api.get('/social'),
}

/* ── Stats/Insights ── */
export const statsApi = {
  moodTrend: (days: number) => api.get('/stats/mood-trend', { params: { days } }),
  moodCalendar: (year: number, month: number) =>
    api.get('/stats/mood-calendar', { params: { year, month } }),
  stressSources: () => api.get('/stats/stress-sources'),
  keyEvents: (limit?: number) => api.get('/stats/key-events', { params: { limit } }),
  relationshipGraph: () => api.get('/stats/relationship-graph'),
}

/* ── Upload ── */
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
