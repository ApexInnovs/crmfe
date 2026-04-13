import React, { useEffect, useState } from "react";
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
    value: "coustomer",
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
      } else {
        await createLead(payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save lead");
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
    } catch (_) {
      alert("Failed to add note");
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
        assignedTo: user._id,
      });

      // Refresh and close modal
      setAddRecordingModal({ open: false, lead: null });
      setRecordingFile(null);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to upload recording");
    } finally {
      setUploadingRecording(false);
    }
  };

  const leadLabel = (lead) =>
    lead.leadData?.name ||
    lead.leadData?.email ||
    `Lead #${lead._id?.slice(-6)}`;

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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={rating > 0 ? "#f59e0b" : "none"}
              stroke={rating > 0 ? "#f59e0b" : "#d1d5db"}
              strokeWidth="1"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
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
          coustomer: { label: 'Customer', bgGradient: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
          lost: { label: 'Lost', bgGradient: 'from-slate-50 to-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400', glow: 'rgba(100, 116, 139, 0.15)' },
        };
        const style = statusStyles[v] || statusStyles.created;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-br ${style.bgGradient} ${style.text} border ${style.border} transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default`}
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
          assignedTo: row.assignedTo || "",
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
        <button
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
        </button>
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
        footer={null}
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
          <div className="space-y-4">
            {addRecordingModal.lead && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Lead:</strong> {leadLabel(addRecordingModal.lead)} -{" "}
                  <strong>Auto-assigned to:</strong> {user.name || user.email}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recording File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setRecordingFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer px-3 py-2 focus:outline-none"
              />
              {recordingFile && (
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Selected:</strong> {recordingFile.name}
                </p>
              )}
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
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="lead-form"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
              >
                {editData ? "Update Lead" : "Add Lead"}
              </button>
            </div>
          )
        }
      >
        {modalLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <form
            id="lead-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2  gap-1">
              <Input
                label="Status"
                name="status"
                type="select"
                value={modalFields.status}
                disabled={modalFields.status === "coustomer"}
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
              <div className="col-span-2">
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <div className="space-y-2">
                  {modalFields.notes &&
                    modalFields.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded p-2 group hover:shadow-sm transition-all"
                      >
                        <Input
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
                          placeholder={`Note #${idx + 1}`}
                          required={false}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-medium"
                          onClick={() =>
                            setModalFields((p) => ({
                              ...p,
                              notes: p.notes.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold w-full transition-all"
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
        )}
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
        footer={null}
      >
        {infoModal.lead && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-gray-400 font-medium mb-1">
                  Assigned To
                </span>
                <span className="block text-sm text-gray-800 font-medium">
                  {infoModal.lead.assignedTo &&
                    typeof infoModal.lead.assignedTo === "object"
                    ? infoModal.lead.assignedTo.name
                    : infoModal.lead.assignedTo || "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 font-medium mb-1">
                  Created At
                </span>
                <span className="block text-sm text-gray-800 font-medium">
                  {infoModal.lead.createdAt
                    ? new Date(infoModal.lead.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 font-medium mb-1">
                  Next Meeting
                </span>
                <span className="block text-sm text-gray-800 font-medium">
                  {infoModal.lead.nextMeetingDate
                    ? new Date(
                      infoModal.lead.nextMeetingDate,
                    ).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 font-medium mb-1">
                  Campaign
                </span>
                <span className="block text-sm text-gray-800 font-medium">
                  {infoModal.lead.campigne?.title ||
                    infoModal.lead.campigne?.name ||
                    "—"}
                </span>
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
            ? `Lead Details: ${leadLabel(detailLeadModal.lead)}`
            : "Lead Details"
        }
        footer={null}
      >
        {detailLeadModal.lead && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                {leadLabel(detailLeadModal.lead)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {leadLabel(detailLeadModal.lead)}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">
                    {detailLeadModal.lead.company?.name || "—"}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR_MAP[detailLeadModal.lead.status] || "bg-gray-100 text-gray-500"}`}
                  >
                    {STATUS_LABEL_MAP[detailLeadModal.lead.status] ||
                      detailLeadModal.lead.status}
                  </span>
                </div>
              </div>
            </div>
            <h4 className="font-semibold text-md mb-2">Lead Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(detailLeadModal.lead.leadData || {}).map(
                ([key, value]) => (
                  <div key={key}>
                    <span className="block text-xs text-gray-400 font-medium mb-1">
                      {key}
                    </span>
                    <span className="block text-sm text-gray-800 break-all">
                      {String(value)}
                    </span>
                  </div>
                ),
              )}
            </div>
            {/* Notes Section */}
            <div className="mt-6">
              <h4 className="font-semibold text-md mb-2">Notes</h4>
              {Array.isArray(detailLeadModal.lead.notes) &&
                detailLeadModal.lead.notes.length > 0 ? (
                <ul className="space-y-2">
                  {detailLeadModal.lead.notes.map((note, idx) => (
                    <li
                      key={idx}
                      className="p-2 bg-gray-50 border rounded text-sm text-gray-700"
                    >
                      {typeof note === "string"
                        ? note
                        : note.text || JSON.stringify(note)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400 text-sm">No notes available.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyLeads;
