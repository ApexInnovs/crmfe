import axiosInstance from "../utils/axiosInstance";

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export const createEmployee = async (data) => {
  const response = await axiosInstance.post("/employees", data);
  return response.data;
};

export const getEmployees = async (params) => {
  const response = await axiosInstance.get("/employees", { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await axiosInstance.get(`/employees/${id}`);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await axiosInstance.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await axiosInstance.delete(`/employees/${id}`);
  return response.data;
};

export const loginEmployee = async (data) => {
  const response = await axiosInstance.post("/employees/login", data);
  return response.data;
};

export const changeEmployeePassword = async (id, data) => {
  const response = await axiosInstance.post(
    `/employees/${id}/change-password`,
    data,
  );
  return response.data;
};

// ─── ADMINS ───────────────────────────────────────────────────────────────────

export const loginAdmin = async (data) => {
  const response = await axiosInstance.post("/admin/login", data);
  return response.data;
};

export const createAdmin = async (data) => {
  const response = await axiosInstance.post("/admin", data);
  return response.data;
};

export const getAdmins = async (params) => {
  const response = await axiosInstance.get("/admin", { params });
  return response.data;
};

export const getAdminById = async (id) => {
  const response = await axiosInstance.get(`/admin/${id}`);
  return response.data;
};

export const updateAdmin = async (id, data) => {
  const response = await axiosInstance.patch(`/admin/${id}`, data);
  return response.data;
};

export const deleteAdmin = async (id) => {
  const response = await axiosInstance.delete(`/admin/${id}`);
  return response.data;
};

export const updateAdminPassword = async (id, data) => {
  const response = await axiosInstance.patch(`/admin/${id}/password`, data);
  return response.data;
};
