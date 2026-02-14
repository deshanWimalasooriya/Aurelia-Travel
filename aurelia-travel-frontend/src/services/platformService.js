import axios from 'axios';

const API_URL = 'http://localhost:5000/api/platform';
const api ='http://localhost:5000/api'

// Helper to get the token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        withCredentials: true 
    };
};

const platformService = {
    // 1. Overview
    getOverview: async () => {
        const res = await axios.get(`${API_URL}/overview`, getAuthHeader());
        return res.data;
    },

    // 2. Hotels
    getHotels: async () => {
        const res = await axios.get(`${api}/hotels`, getAuthHeader());
        return res.data;
    },
    updateHotelStatus: async (id, isActive) => {
        const res = await axios.put(`${API_URL}/hotels/${id}/status`, { is_active: isActive }, getAuthHeader());
        return res.data;
    },

    // 3. Users
    getUsers: async () => {
        const res = await axios.get(`${API_URL}/users`, getAuthHeader());
        return res.data;
    },
    manageUser: async (id, action) => { // action: 'ban' or 'delete'
        const res = await axios.post(`${API_URL}/users/${id}/action`, { action }, getAuthHeader());
        return res.data;
    },

    // 4. Finance
    getTransactions: async () => {
        const res = await axios.get(`${API_URL}/finance`, getAuthHeader());
        return res.data;
    },

    // 5. Reviews
    getReviews: async () => {
        const res = await axios.get(`${API_URL}/reviews`, getAuthHeader());
        return res.data;
    },
    deleteReview: async (id) => {
        const res = await axios.delete(`${API_URL}/reviews/${id}`, getAuthHeader());
        return res.data;
    },

    // 6. Settings
    getSettings: async () => {
        const res = await axios.get(`${API_URL}/settings`, getAuthHeader());
        return res.data;
    },
    updateSettings: async (settings) => {
        const res = await axios.put(`${API_URL}/settings`, settings, getAuthHeader());
        return res.data;
    }
};

export default platformService;