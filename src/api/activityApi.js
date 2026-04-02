import axiosInstance from "../utils/axiosInstance";

// Function to fetch activity timeline
export const fetchActivityTimeline = async () => {
  const response = await axiosInstance.get("/activities/timeline");
  return response.data;
};