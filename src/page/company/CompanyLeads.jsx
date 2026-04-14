import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Table from "../../components/common/Table";
import SkeletonLoader from "../../components/common/Skeleton";
import Input from "../../components/common/Input";
import { Modal, ConfirmDialog } from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import {
  getLeads,
  createLead,
  updateLead,
  getCampaignsByCompany,
  fetchLeadPipeline,
  fetchActivityTimeline,
  fetchLeadInsights,
} from "../../api/campigneAndLeadApi";
import { uploadAvatar } from "../../api/uploadApi";
import { getEmployees } from "../../api/employeeAndAdminApi";

const LEAD_STATUSES = [
  { value: "created", label: "Created", color: "bg-blue-100 text-blue-700" },
  {
    value: "not_responsed",
    label: "No Response",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "not_intrested",
    label: "Not Interested",
    color: "bg-red-100 text-red-700",
  },
  {
    value: "intrested_but_later",
    label: "Later",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "intrested",
    label: "Interested",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "customer",
    label: "Customer",
    color: "bg-emerald-100 text-emerald-700",
  },
  { value: "lost", label: "Lost", color: "bg-gray-100 text-gray-500" },
];

const STATUS_COLOR_MAP = Object.fromEntries(
  LEAD_STATUSES.map((s) => [s.value, s.color]),
);
const STATUS_LABEL_MAP = Object.fromEntries(
  LEAD_STATUSES.map((s) => [s.value, s.label]),
);

const EditIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z"
    />
  </svg>
);
const NotesIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
    />
  </svg>
);
const ArchiveIcon = (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const LeadLifecyclePipeline = ({ companyId }) => {
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPipeline = async () => {
      setLoading(true);
      try {
        const data = await fetchLeadPipeline(companyId);
        setPipelineData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) loadPipeline();
  }, [companyId]);

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">Lead Lifecycle Pipeline</h2>
      {loading ? (
        <p>Loading pipeline...</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {pipelineData.map((stage) => (
            <div key={stage.stage} className="p-4 border rounded bg-gray-50">
              <h3 className="text-md font-semibold mb-2">{stage.stage}</h3>
              <p className="text-sm text-gray-600">{stage.count} Leads</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityTimeline = ({ companyId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const data = await fetchActivityTimeline(companyId);
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching activity timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) loadActivities();
  }, [companyId]);

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
      {loading ? (
        <p>Loading activities...</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((activity, index) => (
            <li key={index} className="p-2 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">{activity.description}</p>
              <p className="text-xs text-gray-400">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const LeadIntelligenceEngine = ({ companyId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const data = await fetchLeadInsights(companyId);
        setInsights(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching lead insights:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) loadInsights();
  }, [companyId]);

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">AI Lead Intelligence</h2>
      {loading ? (
        <p>Loading insights...</p>
      ) : (
        <ul className="space-y-4">
          {insights.map((insight, index) => (
            <li key={index} className="p-2 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">{insight.message}</p>
              <p className="text-xs text-gray-400">
                Confidence: {insight.confidence}%
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CompanyLeads = () => {
  // Call Recording Modal state
  const [callRecordingModal, setCallRecordingModal] = useState({
    open: false,
    fileUrl: "",
    fileName: "",
    description: "",
    transcript: "",
  });
  const { user } = useAuth();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    getEmployees({ company: user._id, limit: 100 })
      .then((data) => {
        setEmployees(
          Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [],
        );
      })
      .catch(() => setEmployees([]));
  }, [user._id]);

  // Lead detail modal state
  const [detailLeadModal, setDetailLeadModal] = useState({
    open: false,
    lead: null,
  });
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Info modal state
  const [infoModal, setInfoModal] = useState({ open: false, lead: null });

  // Add Recording Modal state
  const [addRecordingModal, setAddRecordingModal] = useState({
    open: false,
    lead: null,
  });
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  // Add type: 'campaign' | 'thirdparty'
  const initialFields = {
    type: "campaign",
    campigne: "",
    status: "created",
    name: "",
    phone: "",
    organization: "",
    email: "",
    nextMeetingDate: "",
    note: "",
  };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Search and filters
  const [searchText, setSearchText] = useState("");
  const [searchKey, setSearchKey] = useState("leadName");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [filterContactStatus, setFilterContactStatus] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (filterStatus) params.status = filterStatus;
      if (filterCampaign) params.campigne = filterCampaign;
      if (filterAssignedTo) params.assignedTo = filterAssignedTo;
      if (filterContactStatus) params.contacted = filterContactStatus;
      if (searchText) params.search = searchText;
      if (searchKey) params.searchKey = searchKey;
      const data = await getLeads(params);
      const items = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [
    page,
    pageSize,
    filterStatus,
    filterCampaign,
    filterContactStatus,
    searchText,
    searchKey,
    filterAssignedTo
  ]);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaignsByCompany(user._id, { limit: 100 });
      const items = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setCampaigns(items);
    } catch (_) {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setModalFields(initialFields);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      // Only send the required fields in the payload
      let callFileUrl = "";
      if (modalFields.callFile) {
        const formData = new FormData();
        formData.append("file", modalFields.callFile); // Use 'file' as field name
        const uploadRes = await uploadAvatar(formData);
        callFileUrl =
          uploadRes.url || uploadRes.path || uploadRes.fileUrl || "";
      }

      const payload = {
        status: modalFields.status,
        nextMeetingDate: modalFields.nextMeetingDate || null,
        assignedTo: modalFields.assignedTo || null,
        notes: Array.isArray(modalFields.notes)
          ? modalFields.notes
            .filter((n) => n && n.trim())
            .map((n) => ({
              text: n.trim(),
              addedBy: user._id,
              addedAt: new Date().toISOString(),
            }))
          : [],
        ...(callFileUrl ? { callFile: callFileUrl } : {}),
      };

      if (editData) {
        await updateLead(editData._id, payload);
        toast.success("Lead updated successfully!");
      } else {
        await createLead(payload);
        toast.success("Lead created successfully!");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save lead");
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!rowToToggle) return;
    const next = rowToToggle.status === "lost" ? "created" : "lost";
    setLoading(true);
    try {
      await updateLead(rowToToggle._id, { status: next });
      const message = next === "lost" ? "Lead archived" : "Lead restored";
      toast.success(message);
    } catch (e) {
      toast.error("Failed to update lead status");
    } finally {
      setConfirmModalOpen(false);
      setRowToToggle(null);
      load();
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !detailLeadModal.lead) return;
    setAddingNote(true);
    try {
      const existing = Array.isArray(detailLeadModal.lead.notes)
        ? detailLeadModal.lead.notes
        : [];
      await updateLead(detailLeadModal.lead._id, {
        notes: [...existing, { text: noteText.trim() }],
      });
      setNoteText("");
      // Refresh leads and re-select
      const data = await getLeads({
        page,
        limit: pageSize,
        company: user._id,
        status: filterStatus || undefined,
        search: searchText || undefined,
      });
      const items = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setValues(items);
      setTotal(data.total || items.length);
      const refreshed = items.find((l) => l._id === detailLeadModal.lead._id);
      if (refreshed) setDetailLeadModal({ open: true, lead: refreshed });
      toast.success("Note added successfully!");
    } catch (_) {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleUploadRecording = async () => {
    if (!recordingFile || !addRecordingModal.lead) return;
    setUploadingRecording(true);
    try {
      const formData = new FormData();
      formData.append("file", recordingFile);
      const uploadRes = await uploadAvatar(formData);
      const callFileUrl =
        uploadRes.url || uploadRes.path || uploadRes.fileUrl || "";

      // Update lead with call recording and auto-assign to current user
      await updateLead(addRecordingModal.lead._id, {
        callRecording: callFileUrl,
        // assignedTo: user._id,
      });

      // Refresh and close modal
      setAddRecordingModal({ open: false, lead: null });
      setRecordingFile(null);
      load();
      toast.success("Recording uploaded successfully!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to upload recording");
    } finally {
      setUploadingRecording(false);
    }
  };

  const leadLabel = (lead) => {
    if (!lead) return "Lead";
    return lead.leadData?.name ||
      lead.leadData?.email ||
      `Lead #${lead._id?.slice(-6)}`;
  };

  const statusFilterOptions = [
    { value: "", label: "All Statuses" },
    ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];
  const campaignOptions = [
    { value: "", label: "All Campaigns" },
    ...campaigns.map((c) => ({ value: c._id, label: c.title })),
  ];
  const statusSelectOptions = LEAD_STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const EyeIcon = (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        stroke="#6366f1"
        strokeWidth="2"
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
      />
      <circle cx="12" cy="12" r="3" stroke="#6366f1" strokeWidth="2" />
    </svg>
  );

  const tableHeaders = [
    {
      key: "leadName",
      label: "Lead Name",
      render: (v, row) => (
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>
          {row?.leadData?.name || <span style={{ color: '#d1d5db' }}>—</span>}
        </span>
      ),
      searchable: true,
    },
    {
      key: "phone",
      label: "Phone",
      render: (v, row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#374140', fontWeight: 500 }}>
          {row?.leadData?.phone || <span style={{ color: '#d1d5db' }}>—</span>}
        </span>
      ),
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      filter: {
        options: [
          { value: "", label: "All Employees" },
          ...employees.map(emp => ({
            value: emp._id,
            label: emp.name || emp.email || "Unnamed"
          }))
        ],
        value: filterAssignedTo,
        onChange: (v) => {
          setFilterAssignedTo(v);
          setPage(1);
        },
      },
      render: (v, row) => {
        const empName = row.assignedTo && typeof row.assignedTo === "object"
          ? row.assignedTo.name
          : row.assignedTo;
        return (
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374140' }}>
            {empName || '—'}
          </span>
        );
      },
    },
    {
      key: "campigne",
      label: "Campaign",
      render: (v, row) => {
        const campaignName = row.campigne && typeof row.campigne === "object"
          ? row.campigne.title
          : row.campigne;
        return campaignName ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-br from-lime-50 to-lime-100 text-lime-700 border border-lime-200 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default"
            style={{
              boxShadow: '0 0 16px rgba(132, 204, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(132, 204, 22, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(132, 204, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
            }}
          >
            <span className="w-2 h-2 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(132, 204, 22, 0.5)' }} />
            {campaignName}
          </span>
        ) : <span style={{ color: '#d1d5db' }}>—</span>;
      },
    },
    {
      key: "view",
      label: "L Data",
      render: (_, row) => (
        <button
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(132,204,22,0.15) 0%, rgba(101,163,13,0.1) 100%)',
            border: '1px solid rgba(132,204,22,0.25)',
            color: '#4d7c0f', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
            padding: 0,
          }}
          title="View Lead Data"
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132,204,22,0.25) 0%, rgba(101,163,13,0.18) 100%)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(101,163,13,0.15)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132,204,22,0.15) 0%, rgba(101,163,13,0.1) 100%)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => setDetailLeadModal({ open: true, lead: row })}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ),
    },
    {
      key: "info",
      label: "Info",
      render: (_, row) => (
        <button
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(251, 146, 60, 0.25)',
            color: '#b45309', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
            padding: 0,
          }}
          title="Show Lead Info"
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.25) 0%, rgba(251, 146, 60, 0.18) 100%)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(251, 146, 60, 0.15)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => setInfoModal({ open: true, lead: row })}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8h.01M12 12v4" strokeLinecap="round" />
          </svg>
        </button>
      ),
    },
    {
      key: "callRecording",
      label: "Rec.",
      render: (_, row) => {
        const hasRecording = row.callRecording
          ? (typeof row.callRecording === "string" && row.callRecording.trim() !== "") ||
          (typeof row.callRecording === "object" && (row.callRecording.url || row.callRecording.path || row.callRecording.fileUrl))
          : false;

        if (hasRecording) {
          return (
            <button
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#047857', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              title="View Call Recording"
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.18) 100%)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() =>
                setCallRecordingModal({
                  open: true,
                  fileUrl: typeof row.callRecording === "string" ? row.callRecording : row.callRecording.url || row.callRecording.path || row.callRecording.fileUrl || "",
                  fileName: typeof row.callRecording === "string" ? row.callRecording.split("/").pop() : row.callRecording.name || "Recording",
                  description: row.callRecordingText || "",
                  transcript: row.callRecordingTranscript || row.transcript || "",
                })
              }
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 512 512">
                <path d="M371.246,351.155c2.61,5.659,0.142,12.367-5.522,14.974l-51.948,23.976 c-5.658,2.614-12.366,0.145-14.978-5.514l-15.575-33.746c-2.611-5.659-0.142-12.367,5.522-14.973l51.948-23.976 c5.658-2.605,12.366-0.136,14.976,5.523l1.522,3.295l65.039-30.062c1.094-0.496,2.187-1.002,3.282-1.595 c1.696-10.752,2.59-21.807,2.59-33.056c0-118.275-95.873-214.052-214.052-214.052C95.778,41.948,0,137.725,0,256 c0,118.178,95.778,214.052,214.052,214.052c93.488,0,173.032-60.027,202.102-143.66L369.71,347.83L371.246,351.155z M214.018,343.785c-48.501,0-87.814-39.308-87.814-87.814c0-48.506,39.313-87.824,87.814-87.824s87.814,39.318,87.814,87.824 C301.832,304.477,262.519,343.785,214.018,343.785z" />
                <path d="M214.018,217.363c-21.316,0-38.589,17.286-38.589,38.598c0,21.332,17.273,38.589,38.589,38.589 s38.589-17.257,38.589-38.589C252.607,234.65,235.334,217.363,214.018,217.363z" />
                <path d="M512,77.096h-73.313v89.603h21.574c0,33.348,0,64.616,0,64.616c0,24.287-13.442,46.494-34.748,57.742 c-1.988,12.844-5.076,25.386-9.359,37.335l18.62-8.565c33.752-15.527,55.355-49.381,55.355-86.512c0,0,0-31.268,0-64.616H512 V77.096z" />
              </svg>
            </button>
          );
        } else {
          return (
            <button
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#991b1b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              title="Add Call Recording"
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.18) 100%)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => setAddRecordingModal({ open: true, lead: row })}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 512 512">
                <path d="M371.246,351.155c2.61,5.659,0.142,12.367-5.522,14.974l-51.948,23.976 c-5.658,2.614-12.366,0.145-14.978-5.514l-15.575-33.746c-2.611-5.659-0.142-12.367,5.522-14.973l51.948-23.976 c5.658-2.605,12.366-0.136,14.976,5.523l1.522,3.295l65.039-30.062c1.094-0.496,2.187-1.002,3.282-1.595 c1.696-10.752,2.59-21.807,2.59-33.056c0-118.275-95.873-214.052-214.052-214.052C95.778,41.948,0,137.725,0,256 c0,118.178,95.778,214.052,214.052,214.052c93.488,0,173.032-60.027,202.102-143.66L369.71,347.83L371.246,351.155z M214.018,343.785c-48.501,0-87.814-39.308-87.814-87.814c0-48.506,39.313-87.824,87.814-87.824s87.814,39.318,87.814,87.824 C301.832,304.477,262.519,343.785,214.018,343.785z" />
                <path d="M214.018,217.363c-21.316,0-38.589,17.286-38.589,38.598c0,21.332,17.273,38.589,38.589,38.589 s38.589-17.257,38.589-38.589C252.607,234.65,235.334,217.363,214.018,217.363z" />
                <path d="M512,77.096h-73.313v89.603h21.574c0,33.348,0,64.616,0,64.616c0,24.287-13.442,46.494-34.748,57.742 c-1.988,12.844-5.076,25.386-9.359,37.335l18.62-8.565c33.752-15.527,55.355-49.381,55.355-86.512c0,0,0-31.268,0-64.616H512 V77.096z" />
              </svg>
            </button>
          );
        }
      },
    },
    {
      key: "call_performance",
      label: "Rating",
      render: (v) => {
        const rating = Number(v) || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            {rating > 0 ? (
              <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" width="18" height="18" preserveAspectRatio="xMidYMid meet">
                <path d="M68.05 7.23l13.46 30.7a7.047 7.047 0 0 0 5.82 4.19l32.79 2.94c3.71.54 5.19 5.09 2.5 7.71l-24.7 20.75c-2 1.68-2.91 4.32-2.36 6.87l7.18 33.61c.63 3.69-3.24 6.51-6.56 4.76L67.56 102a7.033 7.033 0 0 0-7.12 0l-28.62 16.75c-3.31 1.74-7.19-1.07-6.56-4.76l7.18-33.61c.54-2.55-.36-5.19-2.36-6.87L5.37 52.78c-2.68-2.61-1.2-7.17 2.5-7.71l32.79-2.94a7.047 7.047 0 0 0 5.82-4.19l13.46-30.7c1.67-3.36 6.45-3.36 8.11-.01z" fill="#fdd835"></path>
                <path d="M67.07 39.77l-2.28-22.62c-.09-1.26-.35-3.42 1.67-3.42c1.6 0 2.47 3.33 2.47 3.33l6.84 18.16c2.58 6.91 1.52 9.28-.97 10.68c-2.86 1.6-7.08.35-7.73-6.13z" fill="#ffff8d"></path>
                <path d="M95.28 71.51L114.9 56.2c.97-.81 2.72-2.1 1.32-3.57c-1.11-1.16-4.11.51-4.11.51l-17.17 6.71c-5.12 1.77-8.52 4.39-8.82 7.69c-.39 4.4 3.56 7.79 9.16 3.97z" fill="#f4b400"></path>
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            )}
            <span style={{ color: rating > 0 ? '#92400e' : '#d1d5db' }}>{rating}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      filter: {
        options: statusFilterOptions,
        value: filterStatus,
        onChange: (v) => {
          setFilterStatus(v);
          setPage(1);
        },
      },
      render: (v) => {
        const statusStyles = {
          created: { label: 'Created', bgGradient: 'from-rose-50 to-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.15)' },
          not_responsed: { label: 'No Response', bgGradient: 'from-amber-50 to-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500', glow: 'rgba(245, 158, 11, 0.15)' },
          not_intrested: { label: 'Not Interested', bgGradient: 'from-rose-50 to-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500', glow: 'rgba(244, 63, 94, 0.15)' },
          intrested_but_later: { label: 'Later', bgGradient: 'from-orange-50 to-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500', glow: 'rgba(249, 115, 22, 0.15)' },
          intrested: { label: 'Interested', bgGradient: 'from-teal-50 to-teal-100', text: 'text-teal-700', border: 'border-teal-300', dot: 'bg-teal-500', glow: 'rgba(20, 184, 166, 0.15)' },
          customer: { label: 'Customer', bgGradient: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
          lost: { label: 'Lost', bgGradient: 'from-slate-50 to-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400', glow: 'rgba(100, 116, 139, 0.15)' },
        };
        const style = statusStyles[v] || statusStyles.created;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-br ${style.bgGradient} ${style.text} border ${style.border} transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default`}
            style={{
              boxShadow: `0 2px 8px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
            }}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot}`} style={{ boxShadow: `0 0 6px ${style.glow}` }} />
            {style.label}
          </span>
        );
      },
    },
  ];

  const NewUploadIcon = (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path stroke="#6366f1" strokeWidth="2" d="M12 16V4m0 0L7 9m5-5 5 5" />
      <rect
        width="18"
        height="8"
        x="3"
        y="16"
        stroke="#0ea5e9"
        strokeWidth="2"
        rx="2"
      />
    </svg>
  );
  const actions = [
    {
      key: "edit",
      label: "Edit",
      icon: EditIcon,
      onClick: (row) => {
        setEditData(row);
        setModalFields({
          status: row.status || "created",
          nextMeetingDate: row.nextMeetingDate
            ? row.nextMeetingDate.slice(0, 10)
            : "",
          assignedTo: (typeof row.assignedTo === 'object' && row.assignedTo !== null ? row.assignedTo._id : row.assignedTo) || "",
          notes: Array.isArray(row.notes)
            ? row.notes.map((n) => (typeof n === "string" ? n : n.text || ""))
            : [""],
          callFile: null,
        });
        setModalOpen(true);
      },
    },
    {
      key: "archive",
      label: "Mark Lost / Reopen",
      icon: ArchiveIcon,
      onClick: (row) => {
        setRowToToggle(row);
        setConfirmModalOpen(true);
      },
    },
  ];
  // Call recording upload state
  // Employees for assignedTo

  return (
    <div className="p-2">
      {/* Custom Header with Search and Add Button */}
      <div style={{
        background: 'linear-gradient(160deg, #ffffff 0%, #f5f7f4 100%)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        border: '1px solid rgba(200,210,195,0.7)',
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.9) inset, 0 -1px 0 0 rgba(0,0,0,0.06) inset, 0 4px 6px -2px rgba(0,0,0,0.05), 0 12px 28px -6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)',
      }}>
        {/* Search Input + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9aaa98', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setPage(1); }}
              style={{
                padding: '9px 14px 9px 36px',
                background: 'linear-gradient(175deg, #f4f6f3 0%, #ffffff 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(180,190,175,0.5)',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                color: '#374140',
                outline: 'none',
                width: '220px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(132,204,22,0.5)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04) inset, 0 0 0 3px rgba(132,204,22,0.12), 0 1px 0 rgba(255,255,255,0.8)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(180,190,175,0.5)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)';
              }}
            />
          </div>

          {/* Campaign Filter */}
          <select
            value={filterCampaign}
            onChange={(e) => {
              setFilterCampaign(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(180,190,175,0.5)',
              background: 'linear-gradient(175deg, #f4f6f3 0%, #ffffff 100%)',
              fontSize: '13.5px',
              fontFamily: 'inherit',
              color: '#374140',
              cursor: 'pointer',
              outline: 'none',
              height: '38px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(132,204,22,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04) inset, 0 0 0 3px rgba(132,204,22,0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(180,190,175,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)';
            }}
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Contact Status Filter */}
          <select
            value={filterContactStatus}
            onChange={(e) => {
              setFilterContactStatus(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(180,190,175,0.5)',
              background: 'linear-gradient(175deg, #f4f6f3 0%, #ffffff 100%)',
              fontSize: '13.5px',
              fontFamily: 'inherit',
              color: '#374140',
              cursor: 'pointer',
              outline: 'none',
              height: '38px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(132,204,22,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04) inset, 0 0 0 3px rgba(132,204,22,0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(180,190,175,0.5)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)';
            }}
          >
            <option value="">All Contact Status</option>
            <option value="contacted">Contacted</option>
            <option value="not_contacted">Not Contacted</option>
          </select>
        </div>

        {/* Add Lead Button */}
        {/* <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '11px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13.5px',
            fontWeight: '600',
            color: '#1a3a00',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            position: 'relative',
            border: 'none',
            background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
            borderTop: '1px solid rgba(255,255,255,0.45)',
            borderBottom: '1px solid rgba(0,0,0,0.15)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)';
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'translateY(3px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #4d7c0f, 0 2px 4px rgba(74,120,8,0.25)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)';
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add Lead
        </button> */}
      </div>

      {/* Table - Conditional Skeleton/Table Render */}
      {loading ? (
        <SkeletonLoader
          rows={pageSize}
          columns={7}
          columnWidths={['40px', '1fr', '2fr', '110px', '120px', '140px', '160px']}
          isMultiLine={[false, false, true, false, false, false, false]}
        />
      ) : (
        <Table
          headers={tableHeaders}
          values={values}
          total={total}
          page={page}
          pageSize={pageSize}
          loading={false}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          actions={actions}
        />
      )}

      {/* Call Recording Modal */}
      <Modal
        isOpen={callRecordingModal.open}
        onClose={() =>
          setCallRecordingModal({
            open: false,
            fileUrl: "",
            fileName: "",
            description: "",
            transcript: "",
          })
        }
        title="Call Recording"
        footer={
          <button
            type="button"
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#022c03',
              background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(132,204,22,0.5), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onClick={() =>
              setCallRecordingModal({
                open: false,
                fileUrl: "",
                fileName: "",
                description: "",
                transcript: "",
              })
            }
          >
            Close
          </button>
        }
      >
        <div className="space-y-4">
          <div className="font-semibold text-gray-800">
            {callRecordingModal.fileName || "No file"}
          </div>
          {callRecordingModal.fileUrl ? (
            <audio controls style={{ width: "100%" }}>
              <source src={callRecordingModal.fileUrl} />
              Your browser does not support the audio element.
            </audio>
          ) : null}

          {/* Transcript Section */}
          {callRecordingModal.transcript ? (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Transcript</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {callRecordingModal.transcript}
              </p>
            </div>
          ) : callRecordingModal.description ? (
            <div className="text-gray-700 text-sm">
              {callRecordingModal.description}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              No transcript or description available.
            </div>
          )}
        </div>
      </Modal>

      {/* Add Recording Modal */}
      <Modal
        isOpen={addRecordingModal.open}
        onClose={() => {
          setAddRecordingModal({ open: false, lead: null });
          setRecordingFile(null);
        }}
        title={
          addRecordingModal.lead
            ? `Add Recording: ${leadLabel(addRecordingModal.lead)}`
            : "Add Recording"
        }
        footer={
          !uploadingRecording && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setAddRecordingModal({ open: false, lead: null });
                  setRecordingFile(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm disabled:bg-gray-400"
                onClick={handleUploadRecording}
                disabled={!recordingFile}
              >
                Upload Recording
              </button>
            </div>
          )
        }
      >
        {uploadingRecording ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '2px' }}>

            {/* ── Hero Card ── */}
            <div style={{
              background: 'linear-gradient(135deg, #052e16 0%, #14532d 45%, #1a6b3a 100%)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(5,46,22,0.28), inset 0 1px 0 rgba(255,255,255,0.07)'
            }}>
              {/* decorative blobs */}
              <div style={{ position: 'absolute', right: '-18px', top: '-18px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(132,204,22,0.13)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: '40px', bottom: '-28px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74,222,128,0.09)', pointerEvents: 'none' }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '14px', fontWeight: '700', color: '#f0fdf4',
                  margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {leadLabel(addRecordingModal.lead)}
                </h3>
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 500, marginTop: '4px', display: 'block' }}>
                  Auto-assigned to: {user.name || user.email}
                </span>
              </div>
            </div>

            {/* ── File Selection ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #84cc16, #16a34a)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                Select Recording File
              </label>

              <div style={{
                borderRadius: '10px',
                border: '1.5px solid #e2f4e6',
                background: 'linear-gradient(160deg, #fafffe 0%, #f4fdf6 100%)',
                padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setRecordingFile(e.target.files?.[0] || null)}
                  style={{
                    padding: '10px',
                    background: 'white',
                    border: '1px solid #ecfdf5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#1f2937',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                />
                {recordingFile && (
                  <div style={{
                    padding: '8px 10px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)',
                    border: '1px solid #d9f99d',
                    borderLeft: '3px solid #84cc16',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1f2937',
                    fontWeight: 600
                  }}>
                    <span style={{ color: '#65a30d', fontWeight: 700 }}>✓ Selected:</span> {recordingFile.name}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? "Update Lead" : "Add Lead"}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={modalLoading}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                color: '#374151', background: 'white',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                cursor: modalLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: modalLoading ? 0.6 : 1
              }}
              onClick={() => setModalOpen(false)}
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="lead-form"
              disabled={modalLoading}
              style={{
                padding: '6px 16px', fontSize: '12px', fontWeight: 700,
                color: '#022c03',
                background: modalLoading ? 'linear-gradient(90deg, #9ca3af 0%, #d1d5db 100%)' : 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
                border: 'none', borderRadius: '8px',
                boxShadow: modalLoading ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                cursor: modalLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: modalLoading ? 0.8 : 1
              }}
              onMouseEnter={(e) => !modalLoading && (e.target.style.boxShadow = '0 6px 16px rgba(132,204,22,0.5), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)')}
              onMouseLeave={(e) => !modalLoading && (e.target.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)')}
            >
              {modalLoading && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block'
                  }}
                >
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              )}
              {editData ? "Update Lead" : "Add Lead"}
            </button>
          </div>
        }
      >
        <form
          id="lead-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input
              label="Status"
              name="status"
              type="select"
              value={modalFields.status}
              disabled={modalFields.status === "customer"}
              onChange={(e) =>
                setModalFields((p) => ({ ...p, status: e.target.value }))
              }
              options={statusSelectOptions}
              required
            />
            <Input
              label="Next Meeting Date"
              name="nextMeetingDate"
              type="date"
              value={modalFields.nextMeetingDate}
              onChange={(e) =>
                setModalFields((p) => ({
                  ...p,
                  nextMeetingDate: e.target.value,
                }))
              }
              required={false}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Assigned To"
                name="assignedTo"
                type="select"
                value={modalFields.assignedTo}
                onChange={(e) =>
                  setModalFields((p) => ({
                    ...p,
                    assignedTo: e.target.value,
                  }))
                }
                options={employees.map((emp) => ({
                  value: emp._id,
                  label: emp.name,
                }))}
                required={false}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Notes
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {modalFields.notes &&
                  modalFields.notes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(160deg, #fafffe 0%, #f4fdf6 100%)',
                        border: '1.5px solid #e2f4e6',
                        borderLeft: '3px solid #84cc16',
                        borderRadius: '8px',
                        padding: '6px 8px',
                      }}
                    >
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#84cc16',
                        minWidth: '16px', textAlign: 'center'
                      }}>{idx + 1}</span>
                      <input
                        name={`note-${idx}`}
                        type="text"
                        value={note}
                        onChange={(e) =>
                          setModalFields((p) => ({
                            ...p,
                            notes: p.notes.map((n, i) =>
                              i === idx ? e.target.value : n,
                            ),
                          }))
                        }
                        placeholder={`Add note...`}
                        style={{
                          flex: 1, border: 'none', background: 'transparent',
                          fontSize: '12px', fontWeight: 500, color: '#1f2937',
                          outline: 'none', padding: '2px 0'
                        }}
                      />
                      <button
                        type="button"
                        style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, lineHeight: 1
                        }}
                        onClick={() =>
                          setModalFields((p) => ({
                            ...p,
                            notes: p.notes.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                style={{
                  marginTop: '8px', padding: '7px', width: '100%',
                  fontSize: '12px', fontWeight: 700, color: '#022c03',
                  background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(132,204,22,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
                  letterSpacing: '0.04em', textTransform: 'uppercase'
                }}
                onClick={() =>
                  setModalFields((p) => ({
                    ...p,
                    notes: [...(p.notes || []), ""],
                  }))
                }
              >
                + Add Note
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setRowToToggle(null);
        }}
        onConfirm={handleArchive}
        title="Update Lead Status"
        message={
          <>
            Mark as{" "}
            <span className="font-semibold">
              {rowToToggle?.status === "lost" ? '"Created"' : '"Lost"'}
            </span>
            ?
          </>
        }
        confirmLabel="Confirm"
        variant="warning"
      />

      {/* Info Modal - Shows Assigned To, Created Date, Next Meeting, Campaign */}
      <Modal
        isOpen={infoModal.open}
        onClose={() => setInfoModal({ open: false, lead: null })}
        title={
          infoModal.lead
            ? `Lead Info: ${leadLabel(infoModal.lead)}`
            : "Lead Info"
        }
        footer={
          <button
            type="button"
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#022c03',
              background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(132,204,22,0.5), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onClick={() => setInfoModal({ open: false, lead: null })}
          >
            Close
          </button>
        }
      >
        {infoModal.lead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '2px' }}>

            {/* ── Hero Card ── */}
            <div style={{
              background: 'linear-gradient(135deg, #052e16 0%, #14532d 45%, #1a6b3a 100%)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(5,46,22,0.28), inset 0 1px 0 rgba(255,255,255,0.07)'
            }}>
              {/* decorative blobs */}
              <div style={{ position: 'absolute', right: '-18px', top: '-18px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(132,204,22,0.13)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: '40px', bottom: '-28px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74,222,128,0.09)', pointerEvents: 'none' }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '14px', fontWeight: '700', color: '#f0fdf4',
                  margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {leadLabel(infoModal.lead)}
                </h3>
                <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 500, marginTop: '4px', display: 'block' }}>
                  {infoModal.lead.company?.name || "—"}
                </span>
              </div>
            </div>

            {/* ── Lead Info Grid ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #84cc16, #16a34a)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>Lead Information</div>

              <div style={{
                borderRadius: '10px',
                border: '1.5px solid #e2f4e6',
                background: 'linear-gradient(160deg, #fafffe 0%, #f4fdf6 100%)',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '7px',
              }}>
                <div style={{
                  padding: '8px 10px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ecfdf5',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(132,204,22,0.1)',
                }}>
                  <span style={{
                    display: 'block', fontSize: '9px', fontWeight: 700,
                    color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.07em',
                    marginBottom: '3px'
                  }}>Assigned To</span>
                  <span style={{
                    display: 'block', fontSize: '12px', fontWeight: 600,
                    color: '#1f2937', wordBreak: 'break-word', lineHeight: '1.4'
                  }}>
                    {infoModal.lead.assignedTo && typeof infoModal.lead.assignedTo === "object"
                      ? infoModal.lead.assignedTo.name
                      : infoModal.lead.assignedTo || "—"}
                  </span>
                </div>

                <div style={{
                  padding: '8px 10px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ecfdf5',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(132,204,22,0.1)',
                }}>
                  <span style={{
                    display: 'block', fontSize: '9px', fontWeight: 700,
                    color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.07em',
                    marginBottom: '3px'
                  }}>Created At</span>
                  <span style={{
                    display: 'block', fontSize: '12px', fontWeight: 600,
                    color: '#1f2937', wordBreak: 'break-word', lineHeight: '1.4'
                  }}>
                    {infoModal.lead.createdAt
                      ? new Date(infoModal.lead.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                <div style={{
                  padding: '8px 10px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ecfdf5',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(132,204,22,0.1)',
                }}>
                  <span style={{
                    display: 'block', fontSize: '9px', fontWeight: 700,
                    color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.07em',
                    marginBottom: '3px'
                  }}>Next Meeting</span>
                  <span style={{
                    display: 'block', fontSize: '12px', fontWeight: 600,
                    color: '#1f2937', wordBreak: 'break-word', lineHeight: '1.4'
                  }}>
                    {infoModal.lead.nextMeetingDate
                      ? new Date(infoModal.lead.nextMeetingDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                <div style={{
                  padding: '8px 10px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ecfdf5',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(132,204,22,0.1)',
                }}>
                  <span style={{
                    display: 'block', fontSize: '9px', fontWeight: 700,
                    color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.07em',
                    marginBottom: '3px'
                  }}>Campaign</span>
                  <span style={{
                    display: 'block', fontSize: '12px', fontWeight: 600,
                    color: '#1f2937', wordBreak: 'break-word', lineHeight: '1.4'
                  }}>
                    {infoModal.lead.campigne?.title ||
                      infoModal.lead.campigne?.name ||
                      "—"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Lead Data Modal */}
      <Modal
        isOpen={detailLeadModal.open}
        onClose={() => setDetailLeadModal({ open: false, lead: null })}
        title={
          detailLeadModal.lead
            ? `Lead Details` //: ${leadLabel(detailLeadModal.lead)}
            : "Lead Details"
        }
        footer={
          <button
            type="button"
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#022c03',
              background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(132,204,22,0.5), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'}
            onClick={() => setDetailLeadModal({ open: false, lead: null })}
          >
            Close
          </button>
        }
      >
        {detailLeadModal.lead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '2px' }}>

            {/* ── Hero Card ── */}
            <div style={{
              background: 'linear-gradient(135deg, #052e16 0%, #14532d 45%, #1a6b3a 100%)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(5,46,22,0.28), inset 0 1px 0 rgba(255,255,255,0.07)'
            }}>
              {/* decorative blobs */}
              <div style={{ position: 'absolute', right: '-18px', top: '-18px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(132,204,22,0.13)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: '40px', bottom: '-28px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74,222,128,0.09)', pointerEvents: 'none' }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '14px', fontWeight: '700', color: '#f0fdf4',
                  margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {leadLabel(detailLeadModal.lead)}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 500 }}>
                    {detailLeadModal.lead.company?.name || "—"}
                  </span>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700,
                    background: 'rgba(74,222,128,0.18)', color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.32)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {STATUS_LABEL_MAP[detailLeadModal.lead.status] || detailLeadModal.lead.status}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Lead Information ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #84cc16, #16a34a)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>Lead Information</span>
                {Object.keys(detailLeadModal.lead.leadData || {}).length > 0 && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#6b7280',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    borderRadius: '10px', padding: '0 6px', lineHeight: '18px'
                  }}>
                    {Object.keys(detailLeadModal.lead.leadData || {}).length} fields
                  </span>
                )}
              </div>

              {/* Scrollable grid — hides scrollbar */}
              <div style={{
                maxHeight: '232px', overflowY: 'auto',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
                borderRadius: '10px',
                border: '1.5px solid #e2f4e6',
                background: 'linear-gradient(160deg, #fafffe 0%, #f4fdf6 100%)',
                padding: '10px',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '7px',
                }}>
                  {Object.entries(detailLeadModal.lead.leadData || {}).length > 0 ? (
                    Object.entries(detailLeadModal.lead.leadData || {}).map(([key, value]) => (
                      <div key={key} style={{
                        padding: '8px 10px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #ecfdf5',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(132,204,22,0.1)',
                        minWidth: 0, overflow: 'hidden',
                      }}>
                        <span style={{
                          display: 'block', fontSize: '9px', fontWeight: 700,
                          color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.07em',
                          marginBottom: '3px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {key}
                        </span>
                        <span style={{
                          display: 'block', fontSize: '12px', fontWeight: 600,
                          color: '#1f2937', wordBreak: 'break-word', lineHeight: '1.4'
                        }}>
                          {String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      gridColumn: '1 / -1', padding: '16px', textAlign: 'center',
                      color: '#9ca3af', fontSize: '12px'
                    }}>
                      No lead data available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Notes ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'linear-gradient(90deg, #84cc16, #16a34a)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>Notes</span>
                {Array.isArray(detailLeadModal.lead.notes) && detailLeadModal.lead.notes.length > 0 && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#6b7280',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    borderRadius: '10px', padding: '0 6px', lineHeight: '18px'
                  }}>
                    {detailLeadModal.lead.notes.length}
                  </span>
                )}
              </div>

              {Array.isArray(detailLeadModal.lead.notes) && detailLeadModal.lead.notes.length > 0 ? (
                <div style={{
                  maxHeight: '152px', overflowY: 'auto',
                  scrollbarWidth: 'none', msOverflowStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: '5px'
                }}>
                  {detailLeadModal.lead.notes.map((note, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)',
                      border: '1px solid #d9f99d',
                      borderLeft: '3px solid #84cc16',
                      borderRadius: '8px',
                      fontSize: '12px', color: '#374151', lineHeight: '1.55'
                    }}>
                      {typeof note === "string" ? note : note.text || JSON.stringify(note)}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: '12px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f3f4f6 100%)',
                  borderRadius: '8px', border: '1px solid #e5e7eb'
                }}>
                  No notes available.
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyLeads;
