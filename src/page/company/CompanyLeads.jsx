import React, { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getLeads, createLead, updateLead, getCampaignsByCompany, fetchLeadPipeline, fetchActivityTimeline, fetchLeadInsights } from '../../api/campigneAndLeadApi';
import { uploadAvatar } from '../../api/uploadApi';
import { getEmployees } from '../../api/employeeAndAdminApi';


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
    // Call Recording Modal state
    const [callRecordingModal, setCallRecordingModal] = useState({ open: false, fileUrl: '', fileName: '' });
  const { user } = useAuth();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  // Lead detail modal state
  const [detailLeadModal, setDetailLeadModal] = useState({ open: false, lead: null });
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Add type: 'campaign' | 'thirdparty'
  const initialFields = { type: 'campaign', campigne: '', status: 'created', name: '', phone: '', organization: '', email: '', nextMeetingDate: '', note: '' };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Search and filters
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('leadName');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: user._id };
      if (filterStatus) params.status = filterStatus;
      if (filterCampaign) params.campigne = filterCampaign;
      if (searchText) params.search = searchText;
      if (searchKey) params.searchKey = searchKey;
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

  useEffect(() => { load(); }, [page, pageSize, filterStatus, filterCampaign, searchText, searchKey]);

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
      // Only send the required fields in the payload
      let callFileUrl = '';
      if (modalFields.callFile) {
        const formData = new FormData();
        formData.append('avatar', modalFields.callFile);
        const uploadRes = await uploadAvatar(formData);
        callFileUrl = uploadRes.url || uploadRes.path || uploadRes.fileUrl || '';
      }

      const payload = {
        status: modalFields.status,
        nextMeetingDate: modalFields.nextMeetingDate || null,
        assignedTo: modalFields.assignedTo || null,
        notes: Array.isArray(modalFields.notes)
          ? modalFields.notes.filter(n => n && n.trim()).map(n => ({
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
  const campaignOptions = [
    { value: '', label: 'All Campaigns' },
    ...campaigns.map(c => ({ value: c._id, label: c.title }))
  ];
  const statusSelectOptions = LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }));

  const EyeIcon = (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#6366f1" strokeWidth="2"/></svg>
  );
  const tableHeaders = [
    {
      key: 'leadName',
      label: 'Lead Name',
      render: (v, row) => row?.leadData?.name || <span className="text-xs text-gray-400">—</span>,
      searchable: true,
    },
    {
      key: 'campigne',
      label: <span title="Campaign"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path stroke="#6366f1" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" /></svg>Camp.</span>,
      render: v => v?.title || <span className="text-xs text-gray-400">—</span>,
      filter: { options: campaignOptions, value: filterCampaign, onChange: v => { setFilterCampaign(v); setPage(1); } }
    },
    {
      key: 'status',
      label: 'Status',
      filter: { options: statusFilterOptions, value: filterStatus, onChange: v => { setFilterStatus(v); setPage(1); } },
      render: v => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR_MAP[v] || 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL_MAP[v] || v}
        </span>
      ),
    },
    {
      key: 'view',
      label: <span title="View Lead">Lead data</span>,
      render: (_, row) => (
        <button
          className="p-2 rounded-full hover:bg-gray-100"
          title="View Lead Data"
          onClick={() => setDetailLeadModal({ open: true, lead: row })}
        >
          {EyeIcon}
        </button>
      )
    },
    {
      key: 'assignedTo',
      label: <span title="Assigned To"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><circle cx="12" cy="8" r="4" stroke="#f43f5e" strokeWidth="2" /><path stroke="#f43f5e" strokeWidth="2" d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>Assigned To</span>,
      render: v => (typeof v === 'object' && v !== null && v.name)
        ? v.name
        : <span className="text-xs text-gray-400">—</span>,
      searchable: true,
    },
    {
      key: 'callRecording',
      label: <span title="Call Recording"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path stroke="#6366f1" strokeWidth="2" d="M12 5v14m7-7H5" /></svg>Call Recording</span>,
      render: (_, row) => {
        // Always show the button to open the modal, using new fields
        return (
          <button
            className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full focus:outline-none"
            title="View Call Recording"
            onClick={() => setCallRecordingModal({
              open: true,
              fileUrl: row.callRecording
                ? (typeof row.callRecording === 'string' ? row.callRecording : row.callRecording.url || row.callRecording.path || '')
                : '',
              fileName: row.callRecording
                ? (typeof row.callRecording === 'string' ? row.callRecording.split('/').pop() : row.callRecording.name || 'Recording')
                : '',
              description: row.callRecordingText || ''
            })}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2" />
              <polygon points="10,8 16,12 10,16" fill="#6366f1" />
            </svg>
          </button>
        );
      }
    },
 
    {
      key: 'nextMeetingDate',
      label: <span title="Next Meeting"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#10b981" strokeWidth="2" /><path stroke="#10b981" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18" /></svg>Next Mtg</span>,
      render: v => v
        ? <span className="text-xs font-medium text-emerald-700">{new Date(v).toLocaleDateString()}</span>
        : <span className="text-xs text-gray-400">—</span>
    },
       {
      key: 'call_performance',
      label: <span title="Call Performance"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="#f59e42" strokeWidth="1.5" fill="none" /></svg>Rating</span>,
      render: (v) => {
        const rating = Number(v) || 0;
        return (
          <span title={rating ? `${rating} out of 10` : 'No rating'} style={{display:'inline-flex',alignItems:'center',gap:2}}>
            <span style={{fontWeight:500}}>{rating}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e42" stroke="#f59e42" strokeWidth="1.5" style={{verticalAlign:'middle'}}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        );
      }
    },
        {
      key: 'createdAt',
      label: <span title="Created"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="inline mr-1"><path stroke="#6366f1" strokeWidth="2" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2" /></svg>Created</span>,
      format: 'date'
    },
  ];

  const NewUploadIcon = (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="#6366f1" strokeWidth="2" d="M12 16V4m0 0L7 9m5-5 5 5"/><rect width="18" height="8" x="3" y="16" stroke="#0ea5e9" strokeWidth="2" rx="2"/></svg>
  );
  const actions = [
    {
      key: 'edit', label: 'Edit', icon: EditIcon,
      onClick: row => {
        setEditData(row);
        setModalFields({
          status: row.status || 'created',
          nextMeetingDate: row.nextMeetingDate ? row.nextMeetingDate.slice(0, 10) : '',
          assignedTo: row.assignedTo || '',
          notes: Array.isArray(row.notes) ? row.notes.map(n => typeof n === 'string' ? n : n.text || '') : [''],
          callFile: null,
        });
        setModalOpen(true);
      },
    },
    { key: 'archive', label: 'Mark Lost / Reopen', icon: ArchiveIcon, onClick: row => { setRowToToggle(row); setConfirmModalOpen(true); } },
  ];
  // Call recording upload state
  // Employees for assignedTo
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    getEmployees({ company: user._id, limit: 100 }).then(data => {
      setEmployees(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    }).catch(() => setEmployees([]));
  }, [user._id]);

  return (
    <div className="p-2">
      <Table
        headers={tableHeaders}
        values={values}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
        searchKeys={['leadName', 'assignedTo']}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        searchText={searchText}
        onSearchTextChange={t => { setSearchText(t); setPage(1); }}
      />

      {/* Call Recording Modal */}
      <Modal
        isOpen={callRecordingModal.open}
        onClose={() => setCallRecordingModal({ open: false, fileUrl: '', fileName: '', description: '' })}
        title="Call Recording"
        footer={null}
      >
        <div className="space-y-4">
          <div className="font-semibold text-gray-800">{callRecordingModal.fileName || 'No file'}</div>
          {callRecordingModal.fileUrl ? (
            <audio controls style={{ width: '100%' }}>
              <source src={callRecordingModal.fileUrl} />
              Your browser does not support the audio element.
            </audio>
          ) : callRecordingModal.description ? (
            <div className="text-gray-700 text-sm">{callRecordingModal.description}</div>
          ) : (
            <div className="text-gray-400 text-sm">No audio file or description available.</div>
          )}
        </div>
      </Modal>


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
              <div className="grid grid-cols-1 md:grid-cols-2 ">
                <Input
                  label="Status" name="status" type="select"
                  value={modalFields.status}
                  onChange={e => setModalFields(p => ({ ...p, status: e.target.value }))}
                  options={statusSelectOptions} required
                />
                <Input
                  label="Next Meeting Date" name="nextMeetingDate" type="date"
                  value={modalFields.nextMeetingDate}
                  onChange={e => setModalFields(p => ({ ...p, nextMeetingDate: e.target.value }))}
                  required={false}
                />
                <div className="col-span-2">
                  <Input
                    label="Assigned To" name="assignedTo" type="select"
                    value={modalFields.assignedTo}
                    onChange={e => setModalFields(p => ({ ...p, assignedTo: e.target.value }))}
                    options={employees.map(emp => ({ value: emp._id, label: emp.name }))}
                    required={false}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <div className="space-y-2">
                    {modalFields.notes && modalFields.notes.map((note, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded p-2 group hover:shadow-sm transition-all">
                        <Input
                          name={`note-${idx}`}
                          type="text"
                          value={note}
                          onChange={e => setModalFields(p => ({ ...p, notes: p.notes.map((n, i) => i === idx ? e.target.value : n) }))}
                          placeholder={`Note #${idx + 1}`}
                          required={false}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-medium"
                          onClick={() => setModalFields(p => ({ ...p, notes: p.notes.filter((_, i) => i !== idx) }))}
                        >Remove</button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold w-full transition-all"
                    onClick={() => setModalFields(p => ({ ...p, notes: [...(p.notes || []), ''] }))}
                  >+ Add Note</button>
                </div>
                <div className="col-span-2 mt-2">
                  <Input
                    // label={<span className="flex items-center gap-2">Call Recording {NewUploadIcon}</span>}
                    name="callFile"
                    type="file"
                    accept="audio/*"
                    onChange={e => setModalFields(p => ({ ...p, callFile: e.target.files?.[0] }))}
                    required={false}
                  />
                </div>
              </div>
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

      {/* Lead Data Modal */}
      <Modal
        isOpen={detailLeadModal.open}
        onClose={() => setDetailLeadModal({ open: false, lead: null })}
        title={detailLeadModal.lead ? `Lead Details: ${leadLabel(detailLeadModal.lead)}` : 'Lead Details'}
        footer={null}
      >
        {detailLeadModal.lead && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                {leadLabel(detailLeadModal.lead)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{leadLabel(detailLeadModal.lead)}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{detailLeadModal.lead.company?.name || '—'}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR_MAP[detailLeadModal.lead.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL_MAP[detailLeadModal.lead.status] || detailLeadModal.lead.status}
                  </span>
                </div>
              </div>
            </div>
            <h4 className="font-semibold text-md mb-2">Lead Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(detailLeadModal.lead.leadData || {}).map(([key, value]) => (
                <div key={key}>
                  <span className="block text-xs text-gray-400 font-medium mb-1">{key}</span>
                  <span className="block text-sm text-gray-800 break-all">{String(value)}</span>
                </div>
              ))}
            </div>
            {/* Notes Section */}
            <div className="mt-6">
              <h4 className="font-semibold text-md mb-2">Notes</h4>
              {Array.isArray(detailLeadModal.lead.notes) && detailLeadModal.lead.notes.length > 0 ? (
                <ul className="space-y-2">
                  {detailLeadModal.lead.notes.map((note, idx) => (
                    <li key={idx} className="p-2 bg-gray-50 border rounded text-sm text-gray-700">
                      {typeof note === 'string' ? note : (note.text || JSON.stringify(note))}
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
