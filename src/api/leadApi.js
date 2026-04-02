import axiosInstance from "../utils/axiosInstance";

// Function to assign a lead to an employee
export const assignLead = async (leadId, employeeId) => {
  const response = await axiosInstance.post(`/leads/${leadId}/assign`, { employeeId });
  return response.data;
};

// Function to fetch unassigned leads for a company
export const fetchUnassignedLeads = async (companyId) => {
  const response = await axiosInstance.get(`/leads/unassigned/${companyId}`);
  return response.data;
};

// Function to fetch employees for a company
export const fetchEmployees = async (companyId) => {
  const response = await axiosInstance.get(`/employees/${companyId}`);
  return response.data;
};