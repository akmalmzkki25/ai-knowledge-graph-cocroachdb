import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor: Attach Bearer Token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aetherbio_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const loginUser = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const fetchUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchNodes = async (params = {}) => {
  const response = await apiClient.get('/graph/nodes', { params });
  return response.data;
};

export const fetchEdges = async (params = {}) => {
  const response = await apiClient.get('/graph/edges', { params });
  return response.data;
};

export const discoverPath = async (startNodeId, targetNodeId, maxHops = 4) => {
  const response = await apiClient.get('/graph/path', {
    params: { start_node_id: startNodeId, target_node_id: targetNodeId, max_hops: maxHops }
  });
  return response.data;
};

export const ingestTextDocument = async (payload) => {
  const response = await apiClient.post('/ingest/text', payload);
  return response.data;
};

export const ingestPdfDocument = async (formData) => {
  const response = await apiClient.post('/ingest/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const fetchHypotheses = async () => {
  const response = await apiClient.get('/hypotheses');
  return response.data;
};

export const fetchContradictions = async () => {
  const response = await apiClient.get('/lint/contradictions');
  return response.data;
};

export const simulateKnockout = async (nodeId, maxDepth = 3) => {
  const response = await apiClient.get('/counterfactual/knockout', {
    params: { node_id: nodeId, max_depth: maxDepth }
  });
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await apiClient.get('/analytics/stats');
  return response.data;
};

export const askCopilot = async (queryText) => {
  const response = await apiClient.post('/copilot/chat', { query: queryText });
  return response.data;
};

export const generateExecutiveReport = async () => {
  const response = await apiClient.post('/report/generate');
  return response.data;
};

export const compareDrugs = async (drugAId, drugBId) => {
  const response = await apiClient.post('/compare/drugs', {
    drug_a_id: drugAId,
    drug_b_id: drugBId
  });
  return response.data;
};
