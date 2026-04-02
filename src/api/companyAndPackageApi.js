import axiosInstance from "../utils/axiosInstance";

// ─── PACKAGES ─────────────────────────────────────────────────────────────────

export const fetchPackages = async (params = {}) => {
  const response = await axiosInstance.get("/packages", { params });
  return response.data;
};

export const fetchPackageById = async (id) => {
  const response = await axiosInstance.get(`/packages/${id}`);
  return response.data;
};

export const createPackage = async (data) => {
  const response = await axiosInstance.post("/packages", data);
  return response.data;
};

export const updatePackage = async (id, data) => {
  const response = await axiosInstance.put(`/packages/${id}`, data);
  return response.data;
};

export const deletePackage = async (id) => {
  const response = await axiosInstance.delete(`/packages/${id}`);
  return response.data;
};

// ─── COMPANIES ────────────────────────────────────────────────────────────────

export const fetchCompanies = async (params = {}) => {
  const response = await axiosInstance.get("/company", { params });
  return response.data;
};

export const fetchCompanyById = async (id) => {
  const response = await axiosInstance.get(`/company/${id}`);
  return response.data;
};

export const createCompany = async (data) => {
  const response = await axiosInstance.post("/company", data);
  return response.data;
};

export const updateCompany = async (id, data) => {
  const response = await axiosInstance.patch(`/company/${id}`, data);
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await axiosInstance.delete(`/company/${id}`);
  return response.data;
};

export const LoginCompany = async (data) => {
  const response = await axiosInstance.post("/company/login", data);
  return response.data;
};
