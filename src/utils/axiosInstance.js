import axios from "axios";
import { pushCredits } from "./creditiBridge";

const axiosInstance = axios.create({
  baseURL: "https://crmbe.onrender.com/api",
  // baseURL:"http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
   (response) => {
    const credits = response?.data?.creditsLeft;

    if (credits !== undefined) {
      pushCredits(credits); // 🔥 send to context
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
      localStorage.removeItem("permissions");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
