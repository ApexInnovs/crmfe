import axiosInstance from "../utils/axiosInstance";

// Function to fetch credit usage
export const fetchCreditUsage = async () => {
  const response = await axiosInstance.get('/credits/usage');
  return response.data;
};