import axiosInstance from "../utils/axiosInstance";

// Function to fetch analytics data
export const fetchAnalyticsData = async () => {
  const response = await axiosInstance.get('/analytics/data');
  return response.data;
};