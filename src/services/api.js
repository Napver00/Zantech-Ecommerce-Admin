import axiosInstance from '../config/axios';

// API Response Handler
const handleResponse = (response) => {
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.message || 'Something went wrong');
};

// API Error Handler
const handleError = (error) => {
    const message = error.response?.data?.message ||
    (error.response?.data?.errors ?
      Object.values(error.response.data.errors).flat().join(', ') :
      error.message ||
      'Something went wrong');
  throw new Error(message);
};

// Auth Service
export const authService = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/login', credentials);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  logout: async () => {
    try {
      const response = await axiosInstance.post('/logout');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/profile');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// User Service
export const userService = {
  getUsers: async (params) => {
    try {
      const response = await axiosInstance.get('/users', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getUserById: async (id) => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Export all services
export default {
  auth: authService,
  user: userService,
};
