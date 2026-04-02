import axiosInstance from "../utils/axiosInstance";

// Function to fetch performance metrics
export const fetchPerformanceMetrics = async () => {
  const response = await axiosInstance.get('/performance/metrics');
  return response.data;
};