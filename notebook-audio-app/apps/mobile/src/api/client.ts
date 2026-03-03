import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.notebook.audio';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getString('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const deviceId = storage.getString('device_id');
    if (deviceId) {
      config.headers['X-Device-Id'] = deviceId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// API endpoints
export const api = {
  // Projects
  projects: {
    list: () => apiClient.get('/projects'),
    get: (id: string) => apiClient.get(`/projects/${id}`),
    create: (data: { title: string; description?: string }) => 
      apiClient.post('/projects', data),
    update: (id: string, data: { title?: string; description?: string }) =>
      apiClient.patch(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
    sources: (id: string) => apiClient.get(`/projects/${id}/sources`),
    generations: (id: string) => apiClient.get(`/projects/${id}/generations`),
    messages: (id: string) => apiClient.get(`/projects/${id}/messages`),
  },

  // Sources
  sources: {
    get: (id: string) => apiClient.get(`/sources/${id}`),
    delete: (id: string) => apiClient.delete(`/sources/${id}`),
    createUrl: (projectId: string, data: { url: string; title?: string }) =>
      apiClient.post(`/sources/url?projectId=${projectId}`, data),
    createYoutube: (projectId: string, data: { url: string; title?: string }) =>
      apiClient.post(`/sources/youtube?projectId=${projectId}`, data),
    createText: (projectId: string, data: { title: string; text: string }) =>
      apiClient.post(`/sources/text?projectId=${projectId}`, data),
    searchWeb: (query: string) => apiClient.get(`/sources/search/web?q=${encodeURIComponent(query)}`),
    uploadPdf: (projectId: string, file: FormData) =>
      apiClient.post(`/sources/pdf?projectId=${projectId}`, file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    uploadAudio: (projectId: string, file: FormData) =>
      apiClient.post(`/sources/audio?projectId=${projectId}`, file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    uploadImage: (projectId: string, file: FormData) =>
      apiClient.post(`/sources/image?projectId=${projectId}`, file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  },

  // Chat
  chat: {
    send: (data: { projectId: string; message: string; selectedSourceIds?: string[] }) =>
      apiClient.post('/chat', data),
    history: (projectId: string) => apiClient.get(`/chat/history/${projectId}`),
    clear: (projectId: string) => apiClient.delete(`/chat/history/${projectId}`),
  },

  // Generations
  generations: {
    create: (data: { projectId: string; type: string; title: string; settings: any }) =>
      apiClient.post('/generations', data),
    get: (id: string) => apiClient.get(`/generations/${id}`),
    assets: (id: string) => apiClient.get(`/generations/${id}/assets`),
    rate: (id: string, data: { liked: boolean; feedback?: string }) =>
      apiClient.post(`/generations/${id}/rate`, data),
    regenerate: (id: string) => apiClient.post(`/generations/${id}/regenerate`),
    delete: (id: string) => apiClient.delete(`/generations/${id}`),
    getTemplate: (projectId: string, type: string) =>
      apiClient.get(`/generations/templates/${projectId}/${type}`),
    updateTemplate: (projectId: string, type: string, data: any) =>
      apiClient.post(`/generations/templates/${projectId}/${type}`, data),
  },

  // Auth
  auth: {
    createToken: (deviceId?: string) =>
      apiClient.post('/auth/token', { deviceId }),
  },
};
