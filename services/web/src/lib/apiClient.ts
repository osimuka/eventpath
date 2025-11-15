import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add tenant ID to all requests
client.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || 'default';
  config.headers['x-tenant-id'] = tenantId;
  return config;
});

export const api = {
  events: {
    create: (event: Record<string, unknown>) => client.post('/events', event),
    list: (limit?: number, offset?: number) =>
      client.get('/events', { params: { limit, offset } }),
  },
  workflows: {
    create: (workflow: Record<string, unknown>) => client.post('/workflows', workflow),
    list: () => client.get('/workflows'),
    get: (id: string) => client.get(`/workflows/${id}`),
    delete: (id: string) => client.delete(`/workflows/${id}`),
  },
  analytics: {
    getFunnel: (workflowId: string) => client.get(`/analytics/funnels/${workflowId}`),
    getInsights: (workflowId: string) => client.get(`/analytics/insights/${workflowId}`),
  },
};

export default client;
