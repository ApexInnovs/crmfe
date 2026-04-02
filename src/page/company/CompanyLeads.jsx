import React, { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getLeads, createLead, updateLead, getCampaignsByCompany, fetchLeadPipeline, fetchActivityTimeline, fetchLeadInsights } from '../../api/campigneAndLeadApi';
import { AddButton } from '../../components/common/Table';

const LEAD_STATUSES = [
  { value: 'created', label: 'Created', color: 'bg-blue-100 text-blue-700' },
  { value: 'not_responsed', label: 'No Response', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'not_intrested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
  { value: 'intrested_but_later', label: 'Later', color: 'bg-orange-100 text-orange-700' },
  { value: 'intrested', label: 'Interested', color: 'bg-green-100 text-green-700' },
  { value: 'coustomer', label: 'Customer', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-500' },
];

const STATUS_COLOR_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.value, s.color]));
const STATUS_LABEL_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.value, s.label]));

const EditIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" /></svg>;
const NotesIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const ArchiveIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

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
        console.error('Error fetching pipeline data:', error);
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
        console.error('Error fetching activity timeline:', error);
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
              <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
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
        console.error('Error fetching lead insights:', error);
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
              <p className="text-xs text-gray-400">Confidence: {insight.confidence}%</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CompanyLeads = () => {
  const { user } = useAuth();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  // Notes panel state
  const [detailLead, setDetailLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Add type: 'campaign' | 'thirdparty'
  const initialFields = { type: 'campaign', campigne: '', status: 'created', name: '', phone: '', organization: '', email: '', nextMeetingDate: '', note: '' };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Remove search, add campaign filter
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (filterStatus) params.status = filterStatus;
      if (filterCampaign) params.campigne = filterCampaign;
      const data = await getLeads(params);
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, pageSize, filterStatus, filterCampaign]);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaignsByCompany(user._id, { limit: 100 });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setCampaigns(items);
    } catch (_) { setCampaigns([]); }
  };

  useEffect(() => { loadCampaigns(); }, []);

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      // Validation
      if (modalFields.type === 'campaign') {
        if (!modalFields.campigne) {
          alert('Please select a campaign.');
          setModalLoading(false);
          return;
        }
        if (!modalFields.name.trim() || !modalFields.phone.trim() || !modalFields.organization.trim() || !modalFields.note.trim()) {
          alert('Name, Phone, Organization, and Note are required.');
          setModalLoading(false);
          return;
        }
      } else if (modalFields.type === 'thirdparty') {
        if (!modalFields.name.trim() || !modalFields.phone.trim() || !modalFields.organization.trim() || !modalFields.note.trim()) {
          alert('Name, Phone, Organization, and Note are required.');
          setModalLoading(false);
          return;
        }
      }
      const payload = {
        company: user._id,
        createdBy: user._id,
        status: modalFields.status,
        leadData: {
          name: modalFields.name,
          phone: modalFields.phone,
          organization: modalFields.organization,
          email: modalFields.email,
        },
        nextMeetingDate: modalFields.nextMeetingDate || null,
        notes: modalFields.note.trim() ? [{ text: modalFields.note.trim() }] : [],
      };
      if (modalFields.type === 'campaign') {
        payload.campigne = modalFields.campigne;
      }
      if (editData) {
        await updateLead(editData._id, payload);
      } else {
        await createLead(payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save lead');
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!rowToToggle) return;
    const next = rowToToggle.status === 'lost' ? 'created' : 'lost';
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
    if (!noteText.trim() || !detailLead) return;
    setAddingNote(true);
    try {
      const existing = Array.isArray(detailLead.notes) ? detailLead.notes : [];
      await updateLead(detailLead._id, { notes: [...existing, { text: noteText.trim() }] });
      setNoteText('');
      // Refresh leads and re-select
      const data = await getLeads({ page, limit: pageSize, company: user._id, status: filterStatus || undefined, search: searchText || undefined });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
      const refreshed = items.find(l => l._id === detailLead._id);
      if (refreshed) setDetailLead(refreshed);
    } catch (_) {
      alert('Failed to add note');
    } finally { setAddingNote(false); }
  };

  const leadLabel = (lead) => lead.leadData?.name || lead.leadData?.email || `Lead #${lead._id?.slice(-6)}`;

  const statusFilterOptions = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }))];
  const campaignOptions = campaigns.map(c => ({ value: c._id, label: c.title }));
  const statusSelectOptions = LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }));

  const EyeIcon = (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#6366f1" strokeWidth="2"/></svg>
  );
  const tableHeaders = [
    {
      key: 'campigne',
      label: <span title="Campaign"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path stroke="#6366f1" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" /></svg>Camp.</span>,
      render: v => v?.title || <span className="text-xs text-gray-400">—</span>
    },
    {
      key: 'view',
      label: <span title="View Lead">Lead data</span>,
      render: (_, row) => (
        <button
          className="p-2 rounded-full hover:bg-gray-100"
          title="View Lead Data"
          onClick={() => setDetailLead(row)}
        >
          {EyeIcon}
        </button>
      )
    },
    {
      key: 'salesPerson',
      label: <span title="Salesperson"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><circle cx="12" cy="8" r="4" stroke="#f43f5e" strokeWidth="2" /><path stroke="#f43f5e" strokeWidth="2" d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>Sales</span>,
      render: v => v?.name || <span className="text-xs text-gray-400">—</span>
    },
    {
      key: 'createdAt',
      label: <span title="Created"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path stroke="#6366f1" strokeWidth="2" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2" /></svg>Created</span>,
      format: 'date'
    },
    {
      key: 'nextMeetingDate',
      label: <span title="Next Meeting"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#10b981" strokeWidth="2" /><path stroke="#10b981" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18" /></svg>Next Mtg</span>,
      render: v => v
        ? <span className="text-xs font-medium text-emerald-700">{new Date(v).toLocaleDateString()}</span>
        : <span className="text-xs text-gray-400">—</span>
    },
  ];

  const CallUploadIcon = (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M12 20v-6m0 0V4m0 10H6m6 0h6" /><path stroke="#0ea5e9" strokeWidth="2" d="M22 16.92V21a1 1 0 0 1-1.09 1A19.91 19.91 0 0 1 3 5.09 1 1 0 0 1 4 4h4.09a1 1 0 0 1 1 .75l1.1 4.4a1 1 0 0 1-.29 1L8.21 12.21a16 16 0 0 0 7.58 7.58l2.06-2.06a1 1 0 0 1 1-.29l4.4 1.1a1 1 0 0 1 .75 1V21z" /></svg>
  );
  const actions = [
    {
      key: 'edit', label: 'Edit', icon: EditIcon,
      onClick: row => {
        setEditData(row);
        setModalFields({
          type: row.campigne ? 'campaign' : 'thirdparty',
          campigne: row.campigne?._id || row.campigne || '',
          status: row.status || 'created',
          name: row.leadData?.name || '',
          phone: row.leadData?.phone || '',
          organization: row.leadData?.organization || '',
          email: row.leadData?.email || '',
          nextMeetingDate: row.nextMeetingDate ? row.nextMeetingDate.slice(0, 10) : '',
          note: '',
        });
        setModalOpen(true);
      },
    },
    {
      key: 'notes', label: 'View Notes', icon: NotesIcon,
      onClick: row => { setDetailLead(row); setNoteText(''); },
    },
    {
      key: 'callupload',
      label: 'Upload Call',
      icon: CallUploadIcon,
      onClick: row => {
        setUploadingLeadId(row._id);
        setTimeout(() => fileInputRef.current?.click(), 0);
      },
    },
    { key: 'archive', label: 'Mark Lost / Reopen', icon: ArchiveIcon, onClick: row => { setRowToToggle(row); setConfirmModalOpen(true); } },
  ];
  // Call recording upload state
  const [uploadingLeadId, setUploadingLeadId] = useState(null);
  const fileInputRef = React.useRef();

  const handleCallFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingLeadId) return;
    // TODO: Implement upload logic here (API call)
    alert(`Uploading call recording for lead: ${uploadingLeadId}\nFile: ${file.name}`);
    setUploadingLeadId(null);
    e.target.value = '';
  };

  return (
    <div className="p-2">
      <PageHeader
        title="Leads"
        actions={
          <AddButton onAdd={() => setModalOpen(true)} addLabel="Add Lead" />
        }
      />

      {/* Campaign filter dropdown */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Filter by Campaign:</label>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={filterCampaign}
          onChange={e => { setFilterCampaign(e.target.value); setPage(1); }}
        >
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>
      <Table
        headers={tableHeaders} values={values} total={total} page={page} pageSize={pageSize}
        loading={loading} onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
      />
      {/* Hidden file input for call upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleCallFileChange}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Update Lead' : 'Add Lead'}
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" form="lead-form" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm">{editData ? 'Update Lead' : 'Add Lead'}</button>
            </div>
          )
        }
      >
        {modalLoading
          ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          : (
            <form id="lead-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={modalFields.type}
                    onChange={e => setModalFields(p => ({ ...p, type: e.target.value, campigne: '' }))}
                  >
                    <option value="campaign">Campaign</option>
                    <option value="thirdparty">3rd Party</option>
                  </select>
                </div>
                <Input
                  label="Status" name="status" type="select"
                  value={modalFields.status}
                  onChange={e => setModalFields(p => ({ ...p, status: e.target.value }))}
                  options={statusSelectOptions} required
                />
                {modalFields.type === 'campaign' && (
                  <Input
                    label="Campaign" name="campigne" type="select"
                    value={modalFields.campigne}
                    onChange={e => setModalFields(p => ({ ...p, campigne: e.target.value }))}
                    options={campaignOptions}
                    required
                  />
                )}
                <Input
                  label="Name" name="name" type="text"
                  value={modalFields.name}
                  onChange={e => setModalFields(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <Input
                  label="Phone" name="phone" type="text"
                  value={modalFields.phone}
                  onChange={e => setModalFields(p => ({ ...p, phone: e.target.value }))}
                  required
                />
                <Input
                  label="Organization" name="organization" type="text"
                  value={modalFields.organization}
                  onChange={e => setModalFields(p => ({ ...p, organization: e.target.value }))}
                  required
                />
                <Input
                  label="Email" name="email" type="email"
                  value={modalFields.email}
                  onChange={e => setModalFields(p => ({ ...p, email: e.target.value }))}
                  required={false}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Meeting Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={modalFields.nextMeetingDate}
                    onChange={e => setModalFields(p => ({ ...p, nextMeetingDate: e.target.value }))}
                  />
                </div>
              </div>
              <Input
                label="Add Note" name="note" type="textarea"
                placeholder="Any notes about this lead..."
                value={modalFields.note}
                onChange={e => setModalFields(p => ({ ...p, note: e.target.value }))}
                required
              />
            </form>
          )}
      </Modal>

      {/* Confirm modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRowToToggle(null); }}
        onConfirm={handleArchive}
        title="Update Lead Status"
        message={<>Mark as <span className="font-semibold">{rowToToggle?.status === 'lost' ? '"Created"' : '"Lost"'}</span>?</>}
        confirmLabel="Confirm"
        variant="warning"
      />

      {/* Lead Data Slide-Over Panel */}
      {detailLead && (
        <div className="fixed inset-0 z-50" onClick={() => setDetailLead(null)}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Panel */}
          <div
            className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                {leadLabel(detailLead)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{leadLabel(detailLead)}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{detailLead.company?.name || '—'}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR_MAP[detailLead.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL_MAP[detailLead.status] || detailLead.status}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full p-2" onClick={() => setDetailLead(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Dynamic Lead Data */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="font-semibold text-md mb-2">Lead Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(detailLead.leadData || {}).map(([key, value]) => (
                  <div key={key}>
                    <span className="block text-xs text-gray-400 font-medium mb-1">{key}</span>
                    <span className="block text-sm text-gray-800 break-all">{String(value)}</span>
                  </div>
                ))}
                {Object.entries(detailLead).filter(([k]) => !['leadData','company','campigne','status','_id','__v','createdAt','updatedAt'].includes(k)).map(([key, value]) => (
                  <div key={key}>
                    <span className="block text-xs text-gray-400 font-medium mb-1">{key}</span>
                    <span className="block text-sm text-gray-800 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLeads;
