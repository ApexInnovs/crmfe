import axiosInstance from '../utils/axiosInstance';
// PERMISSIONS

// Get all permissions (with optional pagination/search)
export const fetchPermissions = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/permissions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error.response?.data || error.message);
    throw error;
  }
};

// Get a single permission by ID
export const fetchPermissionById = async (id) => {
  const response = await axiosInstance.get(`/permissions/${id}`);
  return response.data;
};

// Create a new permission
export const createPermission = async (data) => {
  const response = await axiosInstance.post('/permissions', data);
  return response.data;
};

// Update a permission by ID
export const updatePermission = async (id, data) => {
  const response = await axiosInstance.put(`/permissions/${id}`, data);
  return response.data;
};

// Soft delete a permission by ID
export const deletePermission = async (id) => {
  const response = await axiosInstance.delete(`/permissions/${id}`);
  return response.data;
};

// ROLES

// Get all roles (with optional pagination/search)
export const fetchRoles = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/roles', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error.response?.data || error.message);
    throw error;
  }
};

// Get a single role by ID
export const fetchRoleById = async (id) => {
  const response = await axiosInstance.get(`/roles/${id}`);
  return response.data;
};

// Create a new role
export const createRole = async (data) => {
  const response = await axiosInstance.post('/roles', data);
  return response.data;
};

// Update a role by ID
export const updateRole = async (id, data) => {
  const response = await axiosInstance.put(`/roles/${id}`, data);
  return response.data;
};

// Soft delete a role by ID
export const deleteRole = async (id) => {
  const response = await axiosInstance.delete(`/roles/${id}`);
  return response.data;
};

// Create credentials for a user
export const createCredentials = async (data) => {
  const response = await axiosInstance.post('/credentials', data);
  return response.data;
};