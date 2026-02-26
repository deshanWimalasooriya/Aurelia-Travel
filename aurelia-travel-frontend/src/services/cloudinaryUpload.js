import axios from 'axios';
import api from './api';

// Replace with your actual backend API base URL
const API_URL = 'http://localhost:5000/api'; 

/**
 * Uploads a file directly to Cloudinary using a backend signature.
 * @param {File} file - The image file from an <input type="file">
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadImageDirectly = async (file) => {
    try {
        // 1. Get the VIP Pass (Signature) from your backend
        // Make sure to send the auth token so the backend knows who is asking!
        const token = localStorage.getItem('token') || document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        
        const sigResponse = await axios.get(`${API_URL}/upload/signature`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
        });

        const { signature, timestamp, folder, cloudName, apiKey } = sigResponse.data;

        // 2. Prepare the package for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        // 3. Send the heavy file DIRECTLY to Cloudinary (Bypassing your Node.js server!)
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const uploadResponse = await axios.post(cloudinaryUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 4. Return the lightweight string URL
        return uploadResponse.data.secure_url;

    } catch (error) {
        console.error("Direct Upload Failed:", error);
        throw new Error("Failed to upload image to the cloud.");
    }
};