import axiosInstance from "../utils/axiosInstance";

// Function to export data
export const exportData = async () => {
  const response = await axiosInstance.get('/data/export');
  return response.data;
};

// Function to import data
export const importData = async (formData) => {
  const response = await axiosInstance.post('/data/import', formData);
  return response.data;
};