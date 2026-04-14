import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import SkeletonLoader from '../../components/common/Skeleton';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getClients, createClient, updateClient, getLeads, getCampaignsByCompany } from '../../api/campigneAndLeadApi';
import { getEmployees } from '../../api/employeeAndAdminApi';
import { AddButton } from '../../components/common/Table';

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

const ConvertedClientsPage = () => {
  const { user } = useAuth();
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
    { value: 'offline', label: 'Offline Clients' },
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
    name: '', phone: '', managedBy: '', notes: '',
    projectDetails: { name: '', description: '', startDate: '', deadline: '', budget: '', status: 'Not Started' },
  };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('name');
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (status !== '') params.status = status;
      if (searchText) {
        if (searchKey === 'name') params.name = searchText;
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

  const handleAdd = () => {
    setEditData(null);
    setModalFields(initialFields);
    setModalOpen(true);
  };
  // Load select data (campaigns, employees, leads) on mount
  useEffect(() => {
    loadSelectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    // Phone number validation: must be 10 digits and numeric
    const phone = modalFields.phone || '';
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }
    setModalLoading(true);
    try {
      const payload = {
        ...modalFields,
        company: user._id,
        isOfflineClient: !editData // Mark as offline client only when creating
      };
      if (editData) {
        await updateClient(editData._id, payload);
        toast.success('Client updated successfully!');
      } else {
        await createClient(payload);
        toast.success('Client added successfully!');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save customer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!rowToToggle) return;
    setLoading(true);
    try {
      await updateClient(rowToToggle._id, { status: rowToToggle.status === 1 ? 0 : 1 });
      toast.success(`Client is now ${rowToToggle.status === 1 ? 'Inactive' : 'Active'}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    } finally {
      setConfirmModalOpen(false);
      setRowToToggle(null);
      load();
    }
  };

  const proj = (k) => (e) => setModalFields(p => ({ ...p, projectDetails: { ...p.projectDetails, [k]: e.target.value } }));

  // Project icon SVG
  const ProjectIcon = (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#4d7c0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18" /></svg>
  );

  const [projectModal, setProjectModal] = useState({ open: false, projects: [], clientId: null });

  // Custom Project Modal (replaces broken Modal usage)
  function ProjectManagerModal({ open, projects, clientId, onClose, onSave }) {
    const [localProjects, setLocalProjects] = useState(projects || []);
    const [confirmIdx, setConfirmIdx] = useState(null);
    const [editIdx, setEditIdx] = useState(null); // null = view mode, number = edit mode for that project
    useEffect(() => { setLocalProjects(projects || []); setEditIdx(null); }, [projects, open]);
    const setProjectModal = React.useContext(React.createContext(() => { })); // fallback if not provided
    const handleChange = (idx, key, value) => setLocalProjects(ps => ps.map((p, i) => i === idx ? { ...p, [key]: value } : p));
    const handleAdd = () => {
      setLocalProjects(ps => ([...ps, { name: '', description: '', startDate: '', deadline: '', budget: '', status: 'Not Started' }]));
      setEditIdx(localProjects.length); // Edit the new project
    };
    const handleRemove = async idx => {
      const updated = localProjects.filter((_, i) => i !== idx);
      setLocalProjects(updated);
      if (clientId) {
        try {
          await updateClient(clientId, { projects: updated });
          if (typeof onSave === 'function') onSave();
          setProjectModal(pm => ({ ...pm, projects: updated }));
          toast.success('Project removed.');
        } catch (e) {
          toast.error(e.response?.data?.message || 'Failed to update projects');
        }
      }
    };
    const handleSave = async () => {
      if (!clientId) return onClose();
      try {
        await updateClient(clientId, { projects: localProjects });
        onSave && onSave();
        toast.success('Projects saved successfully!');
        onClose();
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to update projects');
      }
    };
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
        {/* Gradient backdrop */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
        {/* Grain overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply' }} />
        {/* Click to close */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        <style>{`
          @keyframes pmEntrance { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .pm-modal { animation: pmEntrance 0.36s cubic-bezier(0.34,1.3,0.64,1) both; }
        `}</style>

        <div className="pm-modal relative bg-white rounded-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col"
          style={{
            border: '1px solid rgba(200,200,200,0.25)',
            borderTop: '4px solid #84cc16',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
            maxHeight: '85vh',
          }}>

          {/* Header */}
          <div className="px-5 pt-4 pb-3 bg-white shrink-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(132,204,22,0.25) 2.5px, transparent 2.5px)',
            backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
            paddingBottom: 'calc(0.75rem + 4px)',
          }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)', border: '1px solid #d1faa0' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Project Details</h2>
              </div>
              <button onClick={onClose}
                style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '50%' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; e.currentTarget.style.color = '#4d7c0f'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {localProjects.length === 0 && (
              <div className="text-gray-400 text-center py-8 text-sm">No projects yet. Click "Add Project" to get started.</div>
            )}
            {localProjects.map((proj, idx) => (
              <div key={idx} className="rounded-xl p-3 transition-all" style={{ background: '#fafbfc', border: '1.5px solid #e5e7eb' }}>
                {/* View/Edit Toggle */}
                {editIdx === idx ? (
                  <>
                    <div className="flex flex-col md:flex-row gap-3 mb-4">
                      <div className="flex-1">
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Project Name</label>
                        <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.name} onChange={e => handleChange(idx, 'name', e.target.value)} placeholder="Enter project name" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Status</label>
                        <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.status} onChange={e => handleChange(idx, 'status', e.target.value)}>
                          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Description</label>
                      <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.description} onChange={e => handleChange(idx, 'description', e.target.value)} placeholder="Enter project description" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Start Date</label>
                        <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.startDate ? proj.startDate.slice(0, 10) : ''} min={new Date().toISOString().slice(0, 10)} onChange={e => handleChange(idx, 'startDate', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Deadline</label>
                        <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.deadline ? proj.deadline.slice(0, 10) : ''} min={proj.startDate ? proj.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10)} onChange={e => handleChange(idx, 'deadline', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-tight">Budget ($)</label>
                        <input type="number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all" style={{ background: '#fafbfc', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onFocus={e => { e.target.style.borderColor = '#84cc16'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1), 0 1px 3px rgba(0,0,0,0.04)'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }} value={proj.budget} onChange={e => handleChange(idx, 'budget', e.target.value)} min="0" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 600, color: '#022c03', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)', boxShadow: '0 2px 6px rgba(132,204,22,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }} onClick={() => setEditIdx(null)}>Done</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-gray-900">{proj.name || <span className="text-gray-400 font-normal italic">Unnamed Project</span>}</div>
                        {proj.description && <div className="text-xs text-gray-600 mt-1 leading-relaxed">{proj.description}</div>}
                      </div>
                      <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap ${PROJECT_STATUS_COLORS[proj.status] || 'bg-gray-100 text-gray-700'}`}>{proj.status || '—'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3 p-3" style={{ background: 'linear-gradient(135deg, rgba(132,204,22,0.04) 0%, rgba(132,204,22,0.02) 100%)', borderRadius: '8px', border: '1px solid rgba(132,204,22,0.1)' }}>
                      <div>
                        <div className="text-[10px] text-gray-500 font-semibold mb-1.5 uppercase tracking-wider">Start Date</div>
                        <div className="text-sm font-mono text-gray-800 font-medium">{proj.startDate ? proj.startDate.slice(0, 10) : <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-semibold mb-1.5 uppercase tracking-wider">Deadline</div>
                        <div className="text-sm font-mono text-gray-800 font-medium">{proj.deadline ? proj.deadline.slice(0, 10) : <span className="text-gray-300">—</span>}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-semibold mb-1.5 uppercase tracking-wider">Budget</div>
                        <div className="text-sm font-mono text-gray-800 font-medium">{proj.budget ? `₹${proj.budget}` : <span className="text-gray-300">—</span>}</div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#022c03', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)', boxShadow: '0 2px 6px rgba(132,204,22,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }} onClick={() => setEditIdx(idx)}>Edit</button>
                      <button style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#ef4444', boxShadow: '0 2px 6px rgba(239,68,68,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }} onClick={() => setConfirmIdx(idx)}>Remove</button>
                    </div>
                  </>
                )}
                {/* Confirm dialog for remove */}
                {confirmIdx === idx && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', mixBlendMode: 'multiply' }} />
                    <div className="absolute inset-0" onClick={() => setConfirmIdx(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10"
                      style={{ border: '1px solid rgba(200,200,200,0.25)', borderTop: '4px solid #ef4444', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                      <div className="font-bold text-gray-900 mb-1">Remove this project?</div>
                      <div className="text-sm text-gray-500 mb-5">Are you sure you want to remove <span className="font-semibold text-gray-800">"{proj.name || 'this project'}"</span>? This cannot be undone.</div>
                      <div className="flex justify-end gap-3">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" onClick={() => setConfirmIdx(null)}>Cancel</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all" onClick={async () => { await handleRemove(idx); setConfirmIdx(null); onClose && onClose(); }}>Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleAdd}
              style={{
                padding: '8px 18px', fontSize: '13px', fontWeight: 600, color: '#1a3a00', border: 'none',
                borderRadius: '10px', cursor: 'pointer',
                background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                boxShadow: '0 2px 6px rgba(132,204,22,0.25)', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >+ Add Project</button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px', fontSize: '13px', fontWeight: 600, color: '#022c03', border: 'none',
                borderRadius: '10px', cursor: 'pointer',
                background: 'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)',
                boxShadow: '0 2px 6px rgba(132,204,22,0.25)', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Save Changes</button>
          </div>
        </div>
      </div>
    );
  }

  const tableHeaders = [
    {
      key: 'name',
      label: 'Client Name',
      render: (v, row) => <span className="font-semibold text-xs text-gray-800">{row.name || <span className="text-gray-300">—</span>}</span>,
      searchable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (v, row) => <span className="font-mono text-xs text-gray-600">{row.phone || <span className="text-gray-300">—</span>}</span>,
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
        let campaignName = 'Offline Client';
        if (row.lead_id?.campigne?.title) {
          campaignName = row.lead_id.campigne.title;
        } else {
          const campaignObj = row.campaign || row.campigne || campaigns.find(c => c._id === (row.campaign || row.campigne));
          campaignName = campaignObj?.title || campaignObj?.name || 'Offline Client';
        }
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-linear-to-br from-lime-50 to-lime-100 text-lime-700 border border-lime-200 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default"
            style={{
              boxShadow: '0 0 16px rgba(132, 204, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(132, 204, 22, 0.5)' }} />
            {campaignName}
          </span>
        );
      },
    },
    {
      key: 'managedBy',
      label: 'Managed By',
      render: (v, row) => <span className="text-xs text-gray-700 font-medium">{typeof v === 'object' ? v?.name : v || '—'}</span>,
    },

    {
      key: 'leadInfo',
      label: '',
      render: (_, row) => (
        <button
          title="Show Lead Info"
          className="p-1 rounded transition-all"
          style={{ background: 'rgba(132,204,22,0.1)', color: '#4d7c0f' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; }}
          onClick={() => setLeadInfoModal({ open: true, lead: row.lead_id })}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 8h.01M12 12v4" /></svg>
        </button>
      ),
    },
    {
      key: 'projects', label: 'Projects',
      render: (_, row) => (
        <button
          title="View Projects"
          className="p-1 rounded transition-all"
          style={{ background: 'rgba(132,204,22,0.1)', color: '#4d7c0f' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; }}
          onClick={() => setProjectModal({ open: true, projects: Array.isArray(row.projects) ? row.projects.map(p => ({ ...p })) : [], clientId: row._id })}
        >
          {ProjectIcon}
        </button>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      render: v => {
        if (!v) return <span className="text-xs text-gray-400">—</span>;
        const maxLen = 20;
        const isLong = v.length > maxLen;
        const short = isLong ? v.slice(0, maxLen) + '…' : v;
        return (
          <span
            className="text-xs text-gray-500 cursor-pointer"
            title={v}
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
          >
            {short}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: v => {
        if (!v) return '—';
        const date = new Date(v);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    },

    {
      key: 'status',
      label: 'Status',
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
      render: v => {
        const isActive = v === 1;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default ${isActive
              ? 'bg-linear-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-linear-to-br from-red-50 to-red-100 text-red-700 border-red-300'
              }`}
            style={{
              boxShadow: isActive
                ? '0 0 16px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                : '0 0 16px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ boxShadow: isActive ? '0 0 6px rgba(16, 185, 129, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.5)' }} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
  ];
  {/* Project Modal */ }
  <ProjectManagerModal
    open={projectModal.open}
    projects={projectModal.projects}
    clientId={projectModal.clientId}
    onClose={() => setProjectModal({ open: false, projects: [], clientId: null })}
    onSave={load}
  />

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
              width: '260px',
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

        {/* Add Client Button */}
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
          Add Client
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
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
          actions={actions}
        />
      )}


      {/* Project Modal - Only use custom ProjectManagerModal */}
      <ProjectManagerModal
        open={projectModal.open}
        projects={projectModal.projects}
        clientId={projectModal.clientId}
        onClose={() => setProjectModal({ open: false, projects: [], clientId: null })}
        onSave={load}
      />

      {/* Lead Info Modal */}
      {leadInfoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply' }} />
          <div className="absolute inset-0 cursor-pointer" onClick={() => setLeadInfoModal({ open: false, lead: null })} />
          <style>{`
            @keyframes liEntrance { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
            .li-modal { animation: liEntrance 0.36s cubic-bezier(0.34,1.3,0.64,1) both; }
          `}</style>
          <div className="li-modal relative bg-white rounded-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col"
            style={{
              border: '1px solid rgba(200,200,200,0.25)',
              borderTop: '4px solid #84cc16',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              maxHeight: '85vh',
            }}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 bg-white shrink-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(132,204,22,0.25) 2.5px, transparent 2.5px)',
              backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
              paddingBottom: 'calc(0.75rem + 4px)',
            }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)', border: '1px solid #d1faa0' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8h.01M12 12v4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Lead Information</h2>
                </div>
                <button onClick={() => setLeadInfoModal({ open: false, lead: null })}
                  style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '50%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; e.currentTarget.style.color = '#4d7c0f'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {leadInfoModal.lead ? (
                <>
                  {leadInfoModal.lead?.leadData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(leadInfoModal.lead.leadData).map(([key, value]) => (
                        <div key={key} className="flex flex-col rounded-xl px-3 py-2.5 min-h-14"
                          style={{ background: 'linear-gradient(135deg, #fafbfc 0%, #f3f6f1 100%)', border: '1.5px solid #e5e7e0' }}>
                          <span className="text-[11px] font-bold text-gray-400 mb-0.5 uppercase tracking-wide" title={key.replace(/([A-Z])/g, ' $1')}>{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm text-gray-900 font-medium break-all leading-snug">{value === undefined || value === null || value === '' ? <span className="text-gray-300">—</span> : value.toString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-8">No lead data available.</div>
                  )}
                  {leadInfoModal.lead.status !== undefined && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #fafbfc, #f3f6f1)', border: '1.5px solid #e5e7e0' }}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Status:</span>
                      <span className="text-sm text-gray-900 font-medium">{leadInfoModal.lead.status === '' ? '—' : leadInfoModal.lead.status}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-center py-8">No lead info available.</div>
              )}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setLeadInfoModal({ open: false, lead: null })}
                style={{
                  padding: '8px 20px', fontSize: '13px', fontWeight: 600, color: '#1a3a00', border: 'none',
                  borderRadius: '10px', cursor: 'pointer',
                  background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                  boxShadow: '0 2px 6px rgba(132,204,22,0.25)', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#modal-grain)', opacity: 1, mixBlendMode: 'multiply' }} />
          <div className="absolute inset-0 cursor-pointer" onClick={() => !modalLoading && setModalOpen(false)} />
          <style>{`
            @keyframes cmEntrance { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
            .cm-modal { animation: cmEntrance 0.36s cubic-bezier(0.34,1.3,0.64,1) both; }
          `}</style>
          <div className="cm-modal relative bg-white rounded-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col"
            style={{
              border: '1px solid rgba(200,200,200,0.25)',
              borderTop: '4px solid #84cc16',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              maxHeight: '85vh',
            }}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 bg-white shrink-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(132,204,22,0.25) 2.5px, transparent 2.5px)',
              backgroundSize: '12px 2px', backgroundPosition: '0 100%', backgroundRepeat: 'repeat-x',
              paddingBottom: 'calc(0.75rem + 4px)',
            }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f0fce8 0%, #e8fad1 100%)', border: '1px solid #d1faa0' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {editData
                        ? <path d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" />
                        : <path d="M12 4v16m8-8H4" />}
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">{editData ? 'Edit Client' : 'Add Client'}</h2>
                </div>
                <button onClick={() => !modalLoading && setModalOpen(false)} disabled={modalLoading}
                  style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: modalLoading ? 'not-allowed' : 'pointer', color: '#9ca3af', borderRadius: '50%' }}
                  onMouseEnter={e => { if (!modalLoading) { e.currentTarget.style.background = 'rgba(132,204,22,0.1)'; e.currentTarget.style.color = '#4d7c0f'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500" /></div>
              ) : (
                <form id="client-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  {editData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Managed By" name="managedBy" value={typeof modalFields.managedBy === 'object' ? modalFields.managedBy?.name : modalFields.managedBy} onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))} />
                      </div>
                      <div>
                        <Input label="Notes" name="notes" type="textarea" placeholder="Client notes..." value={modalFields.notes} onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))} />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Add mode: offline client fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Client Name"
                          name="name"
                          type="text"
                          placeholder="Enter client name"
                          value={modalFields.name}
                          onChange={e => setModalFields(p => ({ ...p, name: e.target.value }))}
                          required
                        />
                        <Input
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          placeholder="Enter 10-digit phone number"
                          value={modalFields.phone}
                          maxLength={10}
                          pattern="\d{10}"
                          onChange={e => {
                            // Only allow numbers and max 10 digits
                            const val = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                            setModalFields(p => ({ ...p, phone: val }));
                          }}
                          required
                        />
                        <Input
                          label="Managed By"
                          name="managedBy"
                          type="text"
                          placeholder="Enter manager name or email"
                          value={modalFields.managedBy}
                          onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="Notes"
                          name="notes"
                          type="textarea"
                          placeholder="Client notes..."
                          value={modalFields.notes}
                          onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
            {/* Footer */}
            {!modalLoading && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button type="button"
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  onClick={() => setModalOpen(false)}
                >Cancel</button>
                <button type="submit" form="client-form"
                  style={{
                    padding: '10px 22px', fontSize: '13px', fontWeight: 600, color: '#1a3a00', border: 'none',
                    borderRadius: '10px', cursor: 'pointer',
                    background: 'linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)',
                    boxShadow: '0 2px 6px rgba(132,204,22,0.25)', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(132,204,22,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(132,204,22,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >{editData ? 'Save Changes' : 'Add Client'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRowToToggle(null); }}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message={
          <>
            Change status from <span className="font-semibold text-gray-800">"{rowToToggle?.status === 1 ? 'Active' : 'Inactive'}"</span> to <span className="font-semibold text-gray-800">"{rowToToggle?.status === 1 ? 'Inactive' : 'Active'}"</span>?
          </>
        }
        confirmLabel="Confirm"
      />
    </div>
  );
};

export default ConvertedClientsPage;
