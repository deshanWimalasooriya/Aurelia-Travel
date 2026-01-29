import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// ADMIN API ENDPOINTS
// ========================================
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/admin/stats'),
  getRecentBookings: (limit = 10) => api.get(`/admin/bookings/recent?limit=${limit}`),
  getAnalytics: () => api.get('/admin/analytics'),
  getFinancialData: () => api.get('/admin/finance'),

  // Users
  getAllUsers: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/users?${params}`);
  },
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Hotels
  getAllHotels: () => api.get('/admin/hotels'),
  updateHotel: (id, data) => api.put(`/admin/hotels/${id}`, data),
  toggleHotelStatus: (id) => api.put(`/admin/hotels/${id}/toggle-status`),

  // Bookings
  getAllBookings: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/bookings?${params}`);
  },
  updateBooking: (id, status) => api.put(`/admin/bookings/${id}`, { status }),

  // Reviews
  getAllReviews: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/admin/reviews?${params}`);
  },
  toggleReviewApproval: (id) => api.put(`/admin/reviews/${id}/toggle`),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

export default api;
