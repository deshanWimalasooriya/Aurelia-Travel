import axios from 'axios';

// 1. CREATE AXIOS INSTANCE
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // ✅ CRITICAL: Sends cookies (HttpOnly) to backend
  headers: {
    'Content-Type': 'application/json', // Default to JSON
  },
});

// 2. REQUEST INTERCEPTOR (Optional Logging)
api.interceptors.request.use(
  (config) => {
    // If you are sending FormData (images), let the browser set the Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. RESPONSE INTERCEPTOR (Global Error Handling)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is a 401 (Unauthorized) - meaning Token is missing/invalid
    if (error.response && error.response.status === 401) {
      console.error('Session expired or invalid. Please login again.');
      // Optional: You could force a redirect here if you are not using React Router's navigate
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// --- API ENDPOINT COLLECTIONS ---

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

export const userAPI = {
  // Get current user profile
  getProfile: (id) => api.get(`/users/${id}`),
  
  // Update user (Supports FormData for images automatically due to interceptor)
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  
  // Upload specific image endpoint if needed
  uploadImage: (id, formData) => api.post(`/users/${id}/upload-image`, formData),
  
  // Upgrade role
  upgradeToManager: () => api.put('/users/upgrade-to-manager', {}),
};

export const bookingAPI = {
  getMyBookings: () => api.get('/bookings/my-bookings'),
  createBooking: (data) => api.post('/bookings', data),
};

export const hotelAPI = {
  getHotels: () => api.get('/hotels'),
  getHotelById: (id) => api.get(`/hotels/${id}`),
  searchHotels: (params) => api.get('/hotels/search', { params }),
};

// Default export for direct usage (like in your Profile.jsx)
export default api;