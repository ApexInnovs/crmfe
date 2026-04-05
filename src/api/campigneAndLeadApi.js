import axiosInstance from "../utils/axiosInstance";

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export const createCampaign = async (data) => {
  const response = await axiosInstance.post("/campigne", data);
  return response.data;
};

export const getCampaignsByCompany = async (companyId, params) => {
  const response = await axiosInstance.get(`/campigne/company/${companyId}`, {
    params,
  });
  return response.data;
};

export const getCampaignById = async (id) => {
  const response = await axiosInstance.get(`/campigne/${id}`);
  return response.data;
};

export const updateCampaign = async (id, data) => {
  const response = await axiosInstance.patch(`/campigne/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id) => {
  const response = await axiosInstance.delete(`/campigne/${id}`);
  return response.data;
};

export const searchCampaigns = async (companyId, search) => {
  const response = await axiosInstance.get(`/campigne/company/${companyId}`, {
    params: { search, limit: 50 },
  });
  return response.data.data || [];
};

// ─── LEADS ────────────────────────────────────────────────────────────────────

export const createLead = async (data) => {
  const response = await axiosInstance.post("/leads", data);
  return response.data;
};

export const getLeads = async (params) => {
  const response = await axiosInstance.get("/leads", { params });
  return response.data;
};

export const getLeadById = async (id) => {
  const response = await axiosInstance.get(`/leads/${id}`);
  return response.data;
};

export const updateLead = async (id, data) => {
  const response = await axiosInstance.patch(`/leads/${id}`, data);
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await axiosInstance.delete(`/leads/${id}`);
  return response.data;
};

export const importLeadsFromFile = async (data) => {
  // data = { campaignId, leads: [...], company, createdBy }
  const response = await axiosInstance.post("/leads/import", data);
  return response.data;
};

export const exportLeads = async (campaignId) => {
  const response = await axiosInstance.get("/leads", {
    params: { campigne: campaignId, limit: 9999 },
  });
  return response.data.data || [];
};

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

export const createClient = async (data) => {
  const response = await axiosInstance.post("/clients", data);
  return response.data;
};

export const getClients = async (params) => {
  const response = await axiosInstance.get("/clients", { params });
  return response.data;
};

export const getClientById = async (id) => {
  const response = await axiosInstance.get(`/clients/${id}`);
  return response.data;
};

export const updateClient = async (id, data) => {
  const response = await axiosInstance.patch(`/clients/${id}`, data);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await axiosInstance.delete(`/clients/${id}`);
  return response.data;
};

export const addClientDocument = async (id, data) => {
  const response = await axiosInstance.post(`/clients/${id}/document`, data);
  return response.data;
};

export const addClientNote = async (id, data) => {
  const response = await axiosInstance.post(`/clients/${id}/note`, data);
  return response.data;
};

export const fetchLeadPipeline = async (companyId) => {
  const response = await axiosInstance.get("/leads/pipeline", {
    params: companyId ? { company: companyId } : {},
  });
  return response.data;
};

export const fetchActivityTimeline = async (companyId) => {
  const response = await axiosInstance.get("/leads/activity-timeline", {
    params: companyId ? { company: companyId } : {},
  });
  return response.data;
};

export const fetchLeadInsights = async (companyId) => {
  const response = await axiosInstance.get("/leads/insights", {
    params: companyId ? { company: companyId } : {},
  });
  return response.data;
};
