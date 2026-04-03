import React, { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
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
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (status !== '') params.status = status;
      if (searchText) params.search = searchText;
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

  useEffect(() => { load(); }, [page, pageSize, status, searchText]);

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
    loadSelectData();
    setModalOpen(true);
  };

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

  // Project icon SVG
  const ProjectIcon = (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18"/></svg>
  );

  const [projectModal, setProjectModal] = useState({ open: false, projects: [], clientId: null });

  // Custom Project Modal (replaces broken Modal usage)
  function ProjectManagerModal({ open, projects, clientId, onClose, onSave }) {
    const [localProjects, setLocalProjects] = useState(projects || []);
    const [confirmIdx, setConfirmIdx] = useState(null);
    useEffect(() => { setLocalProjects(projects || []); }, [projects, open]);
      const setProjectModal = React.useContext(React.createContext(() => {})); // fallback if not provided
    const handleChange = (idx, key, value) => setLocalProjects(ps => ps.map((p, i) => i === idx ? { ...p, [key]: value } : p));
    const handleAdd = () => setLocalProjects(ps => ([...ps, { name: '', description: '', startDate: '', deadline: '', budget: '', status: 'Not Started' }]));
    const handleRemove = async idx => {
        const updated = localProjects.filter((_, i) => i !== idx);
        setLocalProjects(updated);
        // Also update parent state so modal and table show correct data
        if (clientId) {
          try {
            await updateClient(clientId, { projects: updated });
            // Update parent modal state to reflect removal immediately
            if (typeof onSave === 'function') onSave();
            // Update projectModal.projects in parent
            setProjectModal(pm => ({ ...pm, projects: updated }));
          } catch (e) {
            alert(e.response?.data?.message || 'Failed to update projects');
          }
        }
    };
    const handleSave = async () => {
      if (!clientId) return onClose();
      try {
        await updateClient(clientId, { projects: localProjects });
        onSave && onSave();
        onClose();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to update projects');
      }
    };
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
          <h2 className="text-lg font-bold mb-4">Project Details</h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {localProjects.length === 0 && <div className="text-gray-400">No projects found.</div>}
            {localProjects.map((proj, idx) => (
              <div key={idx} className="border-b pb-2 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <input className="font-semibold text-gray-800 border-b border-dashed border-gray-300 bg-transparent outline-none flex-1" value={proj.name} onChange={e => handleChange(idx, 'name', e.target.value)} placeholder="Project Name" />
                  <select className="ml-2 px-2 py-1 text-xs border rounded bg-gray-50" value={proj.status} onChange={e => handleChange(idx, 'status', e.target.value)}>
                    {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" className="ml-2 text-xs text-red-500 hover:underline" onClick={() => setConfirmIdx(idx)}>Remove</button>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <input className="w-full border-b border-dashed border-gray-200 bg-transparent outline-none" value={proj.description} onChange={e => handleChange(idx, 'description', e.target.value)} placeholder="Description" />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>Start: <input type="date" className="border rounded px-2 py-1 text-xs" value={proj.startDate ? proj.startDate.slice(0,10) : ''} onChange={e => handleChange(idx, 'startDate', e.target.value)} /></span>
                  <span>Deadline: <input type="date" className="border rounded px-2 py-1 text-xs" value={proj.deadline ? proj.deadline.slice(0,10) : ''} onChange={e => handleChange(idx, 'deadline', e.target.value)} /></span>
                  <span>Budget: <input type="number" className="border rounded px-2 py-1 text-xs w-20" value={proj.budget} onChange={e => handleChange(idx, 'budget', e.target.value)} /></span>
                </div>
                {/* Confirm dialog for remove */}
                {confirmIdx === idx && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                      <div className="font-semibold mb-2">Remove this project?</div>
                      <div className="text-sm text-gray-500 mb-4">Are you sure you want to remove <span className="font-bold">{proj.name || 'this project'}</span>?</div>
                      <div className="flex justify-end gap-3">
                        <button className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200" onClick={() => setConfirmIdx(null)}>Cancel</button>
                        <button className="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600" onClick={async () => { await handleRemove(idx); setConfirmIdx(null); }}>Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6">
            <button className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700" onClick={handleAdd}>Add Project</button>
            <button className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  const tableHeaders = [
    {
      key: '_id',
      label: 'Client ID',
      render: v => <span className="font-mono text-xs text-gray-500">{v}</span>,
    },
    {
      key: 'managedBy',
      label: 'Managed By',
      render: (v, row) => <span>{typeof v === 'object' ? v?.name : v}</span>,
    },
    {
      key: 'leadInfo',
      label: '',
      render: (_, row) => (
        <button
          title="Show Lead Info"
          className="p-1 text-indigo-500 hover:text-indigo-700"
          onClick={() => setLeadInfoModal({ open: true, lead: row.lead_id })}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/><path stroke="#6366f1" strokeWidth="2" strokeLinecap="round" d="M12 8h.01M12 12v4"/></svg>
        </button>
      ),
    },
    {
      key: 'projects', label: 'Projects',
      render: (_, row) => (
        <button
          title="View Projects"
          onClick={() => setProjectModal({ open: true, projects: Array.isArray(row.projects) ? row.projects.map(p => ({ ...p })) : [], clientId: row._id })}
          className="p-1 hover:bg-indigo-50 rounded"
        >
          {ProjectIcon}
        </button>
      )
    },
    { key: 'notes', label: 'Notes', render: v => <span className="text-xs text-gray-500">{v || '—'}</span> },
    { key: 'createdAt', label: 'Created', format: 'date' },
    {
      key: 'status', label: 'Status', type: 'status', valueMap: { 0: 'Inactive', 1: 'Active' },
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
    },
  ];
      {/* Project Modal */}
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
      <PageHeader
        title="Converted Clients"
      />

      <Table
        headers={tableHeaders}
        values={values}
        total={total}
        page={page}
        pageSize={pageSize}
        searchKeys={['_id', 'managedBy', 'notes']}
        searchKey={''}
        onSearchKeyChange={() => { }}
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

      {/* Lead Info Modal */}
      <Modal
        isOpen={leadInfoModal.open}
        onClose={() => setLeadInfoModal({ open: false, lead: null })}
        title="Lead Info"
        size="md"
      >
        {leadInfoModal.lead ? (
          <div className="space-y-2">
            {leadInfoModal?.lead?.leadData
              ? Object.entries(leadInfoModal.lead.leadData).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold capitalize">{key}:</span> {value === undefined || value === null || value === '' ? '-' : value.toString()}
                  </div>
                ))
              : <div>No lead data available.</div>
            }
            {/* Show status if present at root */}
            {leadInfoModal.lead.status !== undefined && (
              <div><span className="font-semibold">Status:</span> {leadInfoModal.lead.status === '' ? '-' : leadInfoModal.lead.status}</div>
            )}
          </div>
        ) : (
          <div>No lead info available.</div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Client' : 'Add Client'}
        size="lg"
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" form="client-form" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm">{editData ? 'Save Changes' : 'Add Client'}</button>
            </div>
          )
        }
      >
        {modalLoading
          ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          : (
            <form id="client-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
              <div>
                {editData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Managed By" name="managedBy" value={typeof modalFields.managedBy === 'object' ? modalFields.managedBy?.name : modalFields.managedBy} onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))} />
                    </div>
                    <div className="mt-4">
                      <Input label="Notes" name="notes" type="textarea" placeholder="Client notes..." value={modalFields.notes} onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Add mode: show all fields as before */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Campaign</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={leadCampaign}
                          onChange={e => setLeadCampaign(e.target.value)}
                        >
                          <option value="">All Campaigns</option>
                          {campaignOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Search Lead</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Search by name, email, phone"
                          value={leadSearch}
                          onChange={e => setLeadSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Lead" name="lead_id" type="select" value={modalFields.lead_id} onChange={e => setModalFields(p => ({ ...p, lead_id: e.target.value }))} options={leadOptions} required />
                      <Input label="Managed By" name="managedBy" type="select" value={modalFields.managedBy} onChange={e => setModalFields(p => ({ ...p, managedBy: e.target.value }))} options={employeeOptions} />
                    </div>
                    <div className="mt-4">
                      <Input label="Notes" name="notes" type="textarea" placeholder="Client notes..." value={modalFields.notes} onChange={e => setModalFields(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Project Details (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Project Name" name="projName" placeholder="e.g. Website Redesign" value={modalFields.projectDetails.name} onChange={proj('name')} />
                        <Input label="Project Status" name="projStatus" type="select" value={modalFields.projectDetails.status} onChange={proj('status')} options={projectStatusOptions} />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                          <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={modalFields.projectDetails.startDate} onChange={proj('startDate')} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                          <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={modalFields.projectDetails.deadline} onChange={proj('deadline')} />
                        </div>
                        <Input label="Budget ($)" name="projBudget" type="number" placeholder="e.g. 5000" value={modalFields.projectDetails.budget} onChange={proj('budget')} min="0" required={false} />
                      </div>
                      <div className="mt-4">
                        <Input label="Project Description" name="projDesc" type="textarea" placeholder="Describe the project scope..." value={modalFields.projectDetails.description} onChange={proj('description')} />
                      </div>
                    </div>
                  </>
                )}
              </div>
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
