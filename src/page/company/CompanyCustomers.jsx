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

  const tableHeaders = [
    {
      key: 'managedBy', label: 'Managed By',
      render: v => v?.name ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
            {v.name[0]?.toUpperCase()}
          </div>
          <span className="text-sm">{v.name}</span>
        </div>
      ) : <span className="text-xs text-gray-400">Unassigned</span>,
    },
    {
      key: 'projectDetails', label: 'Project',
      render: v => v?.name ? (
        <div>
          <p className="text-sm font-medium text-gray-800">{v.name}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${PROJECT_STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-700'}`}>
            {v.status}
          </span>
        </div>
      ) : <span className="text-xs text-gray-400">No project</span>,
    },
    { key: 'notes', label: 'Notes', render: v => <span className="text-xs text-gray-500">{v || '—'}</span> },
    {
      key: 'status', label: 'Status', type: 'status', valueMap: { 0: 'Inactive', 1: 'Active' },
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
    },
    { key: 'createdAt', label: 'Created', format: 'date' },
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
      <PageHeader
        title="Converted Clients"
        actions={
          <AddButton onAdd={() => { setEditData(null); setModalFields(initialFields); setModalOpen(true); loadSelectData(); }} addLabel="Add Client" />
        }
      />

      <Table
        headers={tableHeaders} values={values} total={total} page={page} pageSize={pageSize}
        searchKeys={[]} searchKey="" onSearchKeyChange={() => { }}
        searchText={searchText} onSearchTextChange={t => { setSearchText(t); setPage(1); }}
        loading={loading} onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Client Info</h3>
                {/* Campaign filter and lead search */}
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
