import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('📤 Запрос на:', config.url, '| Токен прикреплен:', token.substring(0, 25) + '...');
  } else {
    console.warn('⚠️ ВНИМАНИЕ: Запрос на', config.url, 'уходит БЕЗ токена!');
  }
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('✅ Успех:', response.config.url, 'Статус:', response.status);
    return response;
  },
  error => {
    if (error.response) {
      console.error('🚨 ОШИБКА СЕРВЕРА:', error.response.status, 'для', error.response.config.url);
      console.error('🚨 ПОЛНЫЙ ОТВЕТ СЕРВЕРА:', error.response.data);
      
      // !!! МЫ ВРЕМЕННО ЗАКОММЕНТИРОВАЛИ АВТО-РЕДИРЕКТ, ЧТОБЫ ТЫ УВИДЕЛ ОШИБКУ !!!
      /*
      if (error.response.status === 401) {
        localStorage.clear();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      */
    } else {
      console.error('🚨 ОШИБКА СЕТИ (сервер недоступен):', error.message);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

export const hackathonApi = {
  getAll: () => api.get('/hackathons'),
  getById: id => api.get(`/hackathons/${id}`),
  create: data => api.post('/hackathons', data),
  delete: id => api.delete(`/hackathons/${id}`)
};

export const teamApi = {
  getAll: hackathonId => api.get('/teams', { params: { hackathonId } }),
  create: data => api.post('/teams', data),
  join: teamId => api.post('/teams/join', { teamId }),
  leave: teamId => api.post(`/teams/${teamId}/leave`),
  approve: (teamId, userId) => api.post(`/teams/${teamId}/approve/${userId}`),
  reject: (teamId, userId) => api.post(`/teams/${teamId}/reject/${userId}`)
};

export const submissionApi = {
  getAll: params => api.get('/submissions', { params }),
  submit: formData => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  download: async (id, fileName) => {
    const response = await api.get(`/submissions/download/${id}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'downloaded_file');
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default api;