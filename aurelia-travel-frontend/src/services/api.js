import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

export const hotelAPI = {
  getHotels: () => api.get('/hotels'),
  getHotelById: (id) => api.get(`/hotels/${id}`),
  searchHotels: (params) => api.get('/hotels/search', { params }),
}

export default api
