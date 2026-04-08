import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import useFeedback from '../../hooks/useFeedback';
import { getClients, createClient, updateClient, getLeads, getCampaignsByCompany } from '../../api/campigneAndLeadApi';
import { getEmployees } from '../../api/employeeAndAdminApi';
import { AddButton } from '../../components/common/Table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const capitalize = (s) => s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '—';
const relDate = (d) => d ? dayjs(d).fromNow() : '—';

const PROJECT_STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const PROJECT_STATUS_COLORS = {
  'Not Started': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const EditIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" /></svg>;
const ToggleIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

const InfoIcon = (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="2" />
    <path stroke="#059669" strokeWidth="2" strokeLinecap="round" d="M12 8h.01M12 11v5" />
  </svg>
);

const FolderIcon = (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
    <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10.293 5.293A1 1 0 009.586 5H5a2 2 0 00-2 2z" />
  </svg>
);

// ─── Lead Info Slide Sheet ────────────────────────────────────────────────────
function LeadInfoSheet({ open, lead, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Grainy backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      >
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply',
        }} />
      </div>

      {/* Sheet panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          borderLeft: '1px solid rgba(200,200,200,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{
          backgroundImage: 'radial-gradient(circle, rgba(180,190,175,0.4) 2.5px, transparent 2.5px)',
          backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
          paddingBottom: 'calc(0.75rem + 4px)',
        }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2" /><path stroke="#16a34a" strokeWidth="2" strokeLinecap="round" d="M12 8h.01M12 11v5" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Lead Info</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-0 py-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(180,190,175,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '0 0' }}>
          {lead?.leadData ? (
            <div className="px-5 py-6 space-y-5">
              {/* Primary info card - Name */}
              {lead.leadData.name && (
                <div className="rounded-2xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  borderTop: '3px solid #16a34a',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px rgba(22,163,74,0.15)',
                }}>
                  <div className="px-5 py-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 opacity-75" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em' }}>Full Name</span>
                    <div className="text-2xl font-bold text-emerald-900 mt-2 wrap-break-words">{lead.leadData.name}</div>
                  </div>
                </div>
              )}

              {/* Status badge */}
              {lead?.status !== undefined && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{
                  background: lead.status === 'created' ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                  border: lead.status === 'created' ? '1px solid #93c5fd' : '1px solid #d1d5db',
                }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: lead.status === 'created' ? '#1e40af' : '#6b7280' }}>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 7v5m0 4v.01" />
                  </svg>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: lead.status === 'created' ? '#1e40af' : '#4b5563', fontFamily: "'Space Mono', monospace" }}>Status</span>
                    <div className="text-sm font-bold" style={{ color: lead.status === 'created' ? '#1e3a8a' : '#374151' }}>{lead.status || '—'}</div>
                  </div>
                </div>
              )}

              {/* Data grid */}
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(lead.leadData)
                  .filter(([key]) => key !== 'name')
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="group rounded-xl border transition-all hover:shadow-md px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, #fafcf8 0%, #f0f4ee 100%)',
                        borderColor: 'rgba(200,210,195,0.3)',
                        borderWidth: '1px',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="text-sm font-semibold text-gray-800 mt-1.5 wrap-break-words leading-snug">
                            {value === undefined || value === null || value === '' ? (
                              <span className="text-gray-300 font-normal italic">not provided</span>
                            ) : (
                              value.toString().length > 50 ? `${value.toString().slice(0, 50)}…` : value.toString()
                            )}
                          </div>
                        </div>
                        {value && value !== '' && (
                          <div className="shrink-0 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Footer hint */}
              <div className="text-center pt-2 pb-6">
                <p className="text-xs text-gray-400" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Scroll to see more details
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mb-3 text-gray-200">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M12 8h.01M12 12v4" />
              </svg>
              <p className="text-sm font-semibold text-gray-500 mb-1">No lead data</p>
              <p className="text-xs text-gray-400">Unable to load lead information</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const ConvertedClientsPage = () => {
  const { user } = useAuth();
  const { fire } = useFeedback();
  const hapticTap = () => fire({ haptic: [{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }], sound: true });
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadCampaign, setLeadCampaign] = useState('');
  // New state for main campaign filter
  const [selectedCampaign, setSelectedCampaign] = useState('');

  // Campaign filter options for table header
  const campaignFilterOptions = [
    { value: '', label: 'All' },
    ...campaigns.map(c => ({ value: c._id, label: c.title }))
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  // Lead info modal state
  const [leadInfoModal, setLeadInfoModal] = useState({ open: false, lead: null });

  const initialFields = {
    lead_id: '', managedBy: '', notes: '',
    projectDetails: { name: '', description: '', startDate: '', deadline: '', budget: '', status: 'Not Started' },
  };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('lead_id.leadData.name');
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (status !== '') params.status = status;
      if (searchText) {
        if (searchKey === 'lead_id.leadData.name') params.leadName = searchText;
        else if (searchKey === 'managedBy') params.managedBy = searchText;
        else params.search = searchText;
      }
      if (selectedCampaign) params.campaign = selectedCampaign;
      const data = await getClients(params);
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    const [emp, leadData, campData] = await Promise.allSettled([
      getEmployees({ limit: 100, company: user._id }),
      getLeads({ limit: 100, company: user._id }),
      getCampaignsByCompany(user._id, { limit: 100 }),
    ]);
    if (emp.status === 'fulfilled') {
      const items = Array.isArray(emp.value.data) ? emp.value.data : (Array.isArray(emp.value) ? emp.value : []);
      setEmployees(items);
    }
    if (leadData.status === 'fulfilled') {
      const items = Array.isArray(leadData.value.data) ? leadData.value.data : (Array.isArray(leadData.value) ? leadData.value : []);
      setAllLeads(items);
      setLeads(items);
    }
    if (campData.status === 'fulfilled') {
      const items = Array.isArray(campData.value.data) ? campData.value.data : (Array.isArray(campData.value) ? campData.value : []);
      setCampaigns(items);
    }
  };

  // Filter leads by campaign and search
  useEffect(() => {
    let filtered = allLeads;
    if (leadCampaign) {
      filtered = filtered.filter(l => l.campigne?._id === leadCampaign || l.campigne === leadCampaign);
    }
    if (leadSearch.trim()) {
      const s = leadSearch.trim().toLowerCase();
      filtered = filtered.filter(l =>
        (l.leadData?.name || '').toLowerCase().includes(s) ||
        (l.leadData?.email || '').toLowerCase().includes(s) ||
        (l.leadData?.phone || '').toLowerCase().includes(s)
      );
    }
    setLeads(filtered);
  }, [leadSearch, leadCampaign, allLeads]);

  useEffect(() => { load(); }, [page, pageSize, status, searchText, selectedCampaign]);

  const handleEdit = (row) => {
    setEditData(row);
    setModalFields({
      lead_id: row.lead_id?._id || row.lead_id || '',
      managedBy: row.managedBy?._id || row.managedBy || '',
      notes: row.notes || '',
      projectDetails: {
        name: row.projectDetails?.name || '',
        description: row.projectDetails?.description || '',
        startDate: row.projectDetails?.startDate ? row.projectDetails.startDate.slice(0, 10) : '',
        deadline: row.projectDetails?.deadline ? row.projectDetails.deadline.slice(0, 10) : '',
        budget: row.projectDetails?.budget || '',
        status: row.projectDetails?.status || 'Not Started',
      },
    });
    setModalOpen(true);
  };
  // Load select data (campaigns, employees, leads) on mount
  useEffect(() => {
    loadSelectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      const payload = { ...modalFields, company: user._id };
      if (editData) {
        await updateClient(editData._id, payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save customer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!rowToToggle) return;
    setLoading(true);
    try {
      await updateClient(rowToToggle._id, { status: rowToToggle.status === 1 ? 0 : 1 });
    } finally {
      setConfirmModalOpen(false);
      setRowToToggle(null);
      load();
    }
  };

  const proj = (k) => (e) => setModalFields(p => ({ ...p, projectDetails: { ...p.projectDetails, [k]: e.target.value } }));



  const [projectModal, setProjectModal] = useState({ open: false, projects: [], clientId: null });

  // Custom Project Modal (replaces broken Modal usage)
  function ProjectManagerModal({ open, projects, clientId, onClose, onSave }) {
    const [localProjects, setLocalProjects] = useState(projects || []);
    const [confirmIdx, setConfirmIdx] = useState(null);
    const [editIdx, setEditIdx] = useState(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => { setLocalProjects(projects || []); setEditIdx(null); }, [projects, open]);
    useEffect(() => {
      if (open) requestAnimationFrame(() => setVisible(true));
      else setVisible(false);
    }, [open]);
    const handleChange = (idx, key, value) => setLocalProjects(ps => ps.map((p, i) => i === idx ? { ...p, [key]: value } : p));
    const handleAdd = () => {
      setLocalProjects(ps => ([...ps, { name: '', description: '', startDate: '', deadline: '', budget: '', status: 'Not Started' }]));
      setEditIdx(localProjects.length);
    };
    const handleRemove = async idx => {
      const updated = localProjects.filter((_, i) => i !== idx);
      setLocalProjects(updated);
      if (clientId) {
        try {
          await updateClient(clientId, { projects: updated });
          if (typeof onSave === 'function') onSave();
        } catch (e) {
          alert(e.response?.data?.message || 'Failed to update projects');
        }
      }
    };
    const handleSave = async () => {
      if (!clientId) return doClose();
      try {
        await updateClient(clientId, { projects: localProjects });
        onSave && onSave();
        doClose();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update projects');
      }
    };
    const doClose = () => {
      setVisible(false);
      setTimeout(onClose, 280);
    };
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
        {/* Grainy backdrop */}
        <div className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }} onClick={doClose}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply' }} />
        </div>

        {/* Modal card */}
        <div
          className="relative bg-white rounded-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col max-h-[85vh] transition-all duration-300"
          style={{
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(8px)',
            opacity: visible ? 1 : 0,
            border: '1px solid rgba(200,200,200,0.25)',
            borderRadius: 20,
            borderTop: '4px solid #84cc16',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 shrink-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(180,190,175,0.4) 2.5px, transparent 2.5px)',
            backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
            paddingBottom: 'calc(0.75rem + 4px)',
          }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10.293 5.293A1 1 0 009.586 5H5a2 2 0 00-2 2z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Project Details</h2>
              </div>
              <button onClick={doClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-3 overflow-y-auto flex-1" style={{
            backgroundImage: 'radial-gradient(circle, rgba(180,190,175,0.4) 2.5px, transparent 2.5px)',
            backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
            paddingBottom: 'calc(0.75rem + 4px)',
          }}>
            {localProjects.length === 0 && (
              <div className="text-center py-12">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto mb-3 text-gray-300"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10.293 5.293A1 1 0 009.586 5H5a2 2 0 00-2 2z" /></svg>
                <p className="text-sm text-gray-400 font-medium">No projects yet</p>
                <p className="text-xs text-gray-300 mt-1">Add your first project below</p>
              </div>
            )}
            {localProjects.map((proj, idx) => (
              <div key={idx} className="mb-3 rounded-xl border border-gray-100 p-3 transition-all hover:shadow-sm" style={{ background: 'linear-gradient(135deg, #fafcf8, #f0f4ee)' }}>
                {editIdx === idx ? (
                  <>
                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Project Name</label>
                        <input className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.name} onChange={e => handleChange(idx, 'name', e.target.value)} placeholder="Project Name" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
                        <select className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.status} onChange={e => handleChange(idx, 'status', e.target.value)}>
                          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Description</label>
                      <input className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.description} onChange={e => handleChange(idx, 'description', e.target.value)} placeholder="Description" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Start Date</label>
                        <input type="date" className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.startDate ? proj.startDate.slice(0, 10) : ''} min={new Date().toISOString().slice(0, 10)} onChange={e => handleChange(idx, 'startDate', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Deadline</label>
                        <input type="date" className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.deadline ? proj.deadline.slice(0, 10) : ''} min={proj.startDate ? proj.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)} onChange={e => handleChange(idx, 'deadline', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Budget ($)</label>
                        <input type="number" className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-lime-400 outline-none bg-white" value={proj.budget} onChange={e => handleChange(idx, 'budget', e.target.value)} min="0" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setEditIdx(null)}>Done</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">{proj.name || <span className="text-gray-400">Untitled</span>}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{proj.description || <span className="text-gray-300">No description</span>}</div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PROJECT_STATUS_COLORS[proj.status] || 'bg-gray-100 text-gray-500'}`}>{proj.status || '—'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-2">
                      <span>{proj.startDate ? dayjs(proj.startDate).format('MMM D, YYYY') : '—'} → {proj.deadline ? dayjs(proj.deadline).format('MMM D, YYYY') : '—'}</span>
                      {proj.budget && <span className="font-semibold text-gray-700">${proj.budget}</span>}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" onClick={() => setEditIdx(idx)}>Edit</button>
                      <button className="px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" onClick={() => setConfirmIdx(idx)}>Remove</button>
                    </div>
                  </>
                )}
                {confirmIdx === idx && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 backdrop-blur-sm" onClick={() => setConfirmIdx(null)}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
                      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply' }} />
                    </div>
                    <div className="relative bg-white rounded-xl shadow-lg p-6 w-80" style={{ border: '1px solid rgba(200,200,200,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                      <div className="font-bold text-gray-900 mb-2">Remove this project?</div>
                      <div className="text-sm text-gray-500 mb-4">Are you sure you want to remove <span className="font-bold text-gray-800">{proj.name || 'this project'}</span>?</div>
                      <div className="flex justify-end gap-3">
                        <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => setConfirmIdx(null)}>Cancel</button>
                        <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" onClick={async () => { await handleRemove(idx); setConfirmIdx(null); }}>Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 bg-white shrink-0 flex items-center justify-between gap-3 border-t border-gray-100">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#166534', border: '1px solid #86efac' }}
              onClick={handleAdd}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M12 5v14m-7-7h14" /></svg>
              Add Project
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                color: '#1a3a00',
                background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                borderTop: '1px solid rgba(255,255,255,0.45)',
                borderBottom: '1px solid rgba(0,0,0,0.15)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 3px 0 #4d7c0f, 0 4px 6px rgba(74,120,8,0.35)',
                transition: 'all 0.15s ease',
              }}
              onClick={handleSave}
            >Save</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const tableHeaders = [
    {
      key: 'lead_id.leadData.name',
      label: 'Client Name',
      render: (v, row) => <span className="text-[13px] font-semibold text-gray-800">{capitalize(row.lead_id?.leadData?.name)}</span>,
      searchable: true,
    },
    {
      key: 'managedBy',
      label: 'Managed By',
      render: (v, row) => {
        const name = typeof v === 'object' ? v?.name : v;
        return <span className="text-[13px] text-gray-700 font-medium">{capitalize(name)}</span>;
      },
    },
    {
      key: 'notes',
      label: 'Notes',
      render: v => v ? (
        <span className="text-xs text-gray-500 block max-w-35 truncate cursor-default" title={v}>{v}</span>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (v) => v ? (
        <span className="text-xs text-gray-600" title={dayjs(v).format('MMM D, YYYY h:mm A')}>
          {dayjs(v).format('D MMMM, YYYY')}
        </span>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'campaign',
      label: 'Campaign',
      filter: {
        options: campaignFilterOptions,
        value: selectedCampaign,
        onChange: (val) => { setSelectedCampaign(val); setPage(1); },
      },
      render: (v, row) => {
        // Prefejr campaign name from lead_id.campigne.title if available
        if (row.lead_id?.campigne?.title) {
          return <span className="text-xs text-gray-700">{row.lead_id.campigne.title}</span>;
        }
        // Fallback to previous logic
        const campaignObj = row.campaign || row.campigne || campaigns.find(c => c._id === (row.campaign || row.campigne));
        return <span className="text-xs text-gray-700">{campaignObj?.title || campaignObj?.name || '—'}</span>;
      },
    },
    {
      key: 'leadInfo',
      label: '',
      render: (_, row) => (
        <button
          title="Show Lead Info"
          className="p-1.5 rounded-lg hover:bg-lime-50 transition-colors"
          onClick={() => { hapticTap(); setLeadInfoModal({ open: true, lead: row.lead_id }); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {InfoIcon}
        </button>
      ),
    },
    {
      key: 'projects', label: 'Projects',
      render: (_, row) => (
        <button
          title="View Projects"
          className="p-1.5 rounded-lg hover:bg-lime-50 transition-colors"
          onClick={() => { hapticTap(); setProjectModal({ open: true, projects: Array.isArray(row.projects) ? row.projects.map(p => ({ ...p })) : [], clientId: row._id }); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {FolderIcon}
        </button>
      )
    },
    {
      key: 'status', label: 'Status', type: 'status', valueMap: { 0: 'Inactive', 1: 'Active' },
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
    },
  ];

  const actions = [
    { key: 'edit', label: 'Edit', icon: EditIcon, onClick: handleEdit },
    { key: 'status', label: 'Toggle Status', icon: ToggleIcon, onClick: row => { setRowToToggle(row); setConfirmModalOpen(true); } },
  ];

  const employeeOptions = employees.map(e => ({ value: e._id, label: e.name }));
  const leadOptions = leads.map(l => ({ value: l._id, label: l.leadData?.name || l.leadData?.email || `Lead #${l._id?.slice(-6)}` }));
  const campaignOptions = campaigns.map(c => ({ value: c._id, label: c.title }));
  const projectStatusOptions = PROJECT_STATUSES.map(s => ({ value: s, label: s }));

  return (
    <div className="p-2">

      <Table
        headers={tableHeaders}
        values={values}
        total={total}
        page={page}
        pageSize={pageSize}
        searchKeys={['lead_id.leadData.name', 'managedBy']}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        searchText={searchText}
        onSearchTextChange={t => { setSearchText(t); setPage(1); }}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
      />


      {/* Project Modal - Only use custom ProjectManagerModal */}
      <ProjectManagerModal
        open={projectModal.open}
        projects={projectModal.projects}
        clientId={projectModal.clientId}
        onClose={() => setProjectModal({ open: false, projects: [], clientId: null })}
        onSave={load}
      />

      {/* Lead Info Sheet */}
      <LeadInfoSheet
        open={leadInfoModal.open}
        lead={leadInfoModal.lead}
        onClose={() => setLeadInfoModal({ open: false, lead: null })}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Client' : 'Add Client'}
        size="lg"
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="client-form"
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer"
                style={{
                  color: '#1a3a00',
                  background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                  borderTop: '1px solid rgba(255,255,255,0.45)',
                  borderBottom: '1px solid rgba(0,0,0,0.15)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 3px 0 #4d7c0f, 0 4px 6px rgba(74,120,8,0.35)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 6px 10px rgba(74,120,8,0.40)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 3px 0 #4d7c0f, 0 4px 6px rgba(74,120,8,0.35)';
                }}
              >
                {editData ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          )
        }
      >
        {modalLoading
          ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          : (
            <form id="client-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              {editData ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5" style={{ fontFamily: "'Space Mono', monospace" }}>Managed By</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all bg-linear-to-br from-white to-gray-50"
                      value={typeof modalFields.managedBy === 'object' ? modalFields.managedBy?.name : modalFields.managedBy}
                      onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5" style={{ fontFamily: "'Space Mono', monospace" }}>Notes</label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all bg-linear-to-br from-white to-gray-50 resize-none"
                      placeholder="Add client notes..."
                      rows="4"
                      value={modalFields.notes}
                      onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Lead Selection Section */}
                  <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #fafcf8 0%, #f0f4ee 100%)', border: '1px solid rgba(200,210,195,0.3)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>◆ Find & Assign Lead</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter by Campaign</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 outline-none hover:border-gray-400 transition-colors"
                          value={leadCampaign}
                          onChange={e => setLeadCampaign(e.target.value)}
                        >
                          <option value="">All Campaigns</option>
                          {campaignOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Lead</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 outline-none hover:border-gray-400 transition-colors"
                          placeholder="Name, email, or phone"
                          value={leadSearch}
                          onChange={e => setLeadSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lead *</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 outline-none hover:border-gray-400 transition-colors"
                          value={modalFields.lead_id}
                          onChange={e => setModalFields(p => ({ ...p, lead_id: e.target.value }))}
                          required
                        >
                          <option value="">Select a lead...</option>
                          {leadOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Managed By</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 outline-none hover:border-gray-400 transition-colors"
                          value={modalFields.managedBy}
                          onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))}
                        >
                          <option value="">Select employee...</option>
                          {employeeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Client Details Section */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Space Mono', monospace" }}>Client Information</label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all bg-linear-to-br from-white to-gray-50 resize-none"
                      placeholder="Add notes about this client..."
                      rows="3"
                      value={modalFields.notes}
                      onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>

                  {/* Project Details Section */}
                  <div className="rounded-xl p-4 border border-gray-200" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>◆ Project Details (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Project Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors"
                          placeholder="e.g. Website Redesign"
                          value={modalFields.projectDetails.name}
                          onChange={proj('name')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors"
                          value={modalFields.projectDetails.status}
                          onChange={proj('status')}
                        >
                          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors"
                          value={modalFields.projectDetails.startDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={proj('startDate')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deadline</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors"
                          value={modalFields.projectDetails.deadline}
                          min={modalFields.projectDetails.startDate ? modalFields.projectDetails.startDate : new Date().toISOString().slice(0, 10)}
                          onChange={proj('deadline')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Budget ($)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors"
                          placeholder="0.00"
                          value={modalFields.projectDetails.budget}
                          onChange={proj('budget')}
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none hover:border-gray-400 transition-colors resize-none"
                        placeholder="Describe the project scope..."
                        rows="3"
                        value={modalFields.projectDetails.description}
                        onChange={proj('description')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
      </Modal>

      {/* Confirm modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRowToToggle(null); }}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message="Change status for this customer?"
        confirmLabel="Confirm"
      />
    </div>
  );
};

export default ConvertedClientsPage;
