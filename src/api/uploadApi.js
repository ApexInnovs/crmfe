// uploadApi.js

import axiosInstance from '../utils/axiosInstance';

/**
 * Uploads an avatar image to the server.
 * @param {FormData} formData - The form data containing the file to upload.
 * @returns {Promise<Object>} - The response from the server, including the uploaded file URL.
 */
export const uploadAvatar = async (formData) => {
  try {
    const response = await axiosInstance.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};