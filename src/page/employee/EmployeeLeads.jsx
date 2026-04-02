import React, { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getLeads, createLead, updateLead, getCampaignsByCompany } from '../../api/campigneAndLeadApi';

const LEAD_STATUSES = [
  { value: 'created', label: 'Created', color: 'bg-blue-100 text-blue-700' },
  { value: 'not_responsed', label: 'No Response', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'not_intrested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
  { value: 'intrested_but_later', label: 'Interested (Later)', color: 'bg-orange-100 text-orange-700' },
  { value: 'intrested', label: 'Interested', color: 'bg-green-100 text-green-700' },
  { value: 'coustomer', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-500' },
];

const STATUS_COLOR_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.value, s.color]));
const STATUS_LABEL_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.value, s.label]));

const EditIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" /></svg>;
const NotesIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const ArchiveIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

const EmployeeLeads = () => {
  const { user, hasPermission } = useAuth();
  const companyId = user.company?._id || user.company;

  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  const [detailLead, setDetailLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const initialFields = { campigne: '', status: 'created', nextMeetingDate: '', note: '' };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, company: companyId };
      if (filterStatus) params.status = filterStatus;
      if (searchText) params.search = searchText;
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

  useEffect(() => { load(); }, [page, pageSize, filterStatus, searchText]);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaignsByCompany(companyId, { limit: 100 });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setCampaigns(items);
    } catch (_) { setCampaigns([]); }
  };

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      const payload = {
        company: companyId,
        campigne: modalFields.campigne || null,
        status: modalFields.status,
        nextMeetingDate: modalFields.nextMeetingDate || null,
      };
      if (modalFields.note.trim()) {
        payload.notes = [{ text: modalFields.note.trim() }];
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
      const data = await getLeads({ company: companyId, limit: 1000 });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      const refreshed = items.find(l => l._id === detailLead._id);
      if (refreshed) setDetailLead(refreshed);
    } catch (_) {
      alert('Failed to add note');
    } finally { setAddingNote(false); }
  };

  const statusFilterOptions = [{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }))];
  const campaignOptions = campaigns.map(c => ({ value: c._id, label: c.title }));
  const statusSelectOptions = LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }));

  const leadLabel = (lead) => lead.leadData?.name || lead.leadData?.email || `Lead #${lead._id?.slice(-6)}`;

  const tableHeaders = [
    { key: 'campigne', label: 'Campaign', render: v => v?.title || <span className="text-xs text-gray-400">—</span> },
    {
      key: 'status', label: 'Status',
      filter: { options: statusFilterOptions, value: filterStatus, onChange: v => { setFilterStatus(v); setPage(1); } },
      render: v => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR_MAP[v] || 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL_MAP[v] || v}
        </span>
      ),
    },
    {
      key: 'nextMeetingDate', label: 'Next Meeting',
      render: v => v ? <span className="text-xs font-medium text-emerald-700">{new Date(v).toLocaleDateString()}</span> : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'notes', label: 'Notes',
      render: v => <span className="text-xs text-gray-500">{Array.isArray(v) ? `${v.length} note${v.length !== 1 ? 's' : ''}` : '—'}</span>,
    },
    { key: 'createdAt', label: 'Created', format: 'date' },
  ];

  const actions = [
    ...(hasPermission('edit_leads') ? [{
      key: 'edit', label: 'Edit', icon: EditIcon,
      onClick: row => {
        setEditData(row);
        setModalFields({
          campigne: row.campigne?._id || row.campigne || '',
          status: row.status || 'created',
          nextMeetingDate: row.nextMeetingDate ? row.nextMeetingDate.slice(0, 10) : '',
          note: '',
        });
        loadCampaigns();
        setModalOpen(true);
      },
    }] : []),
    { key: 'notes', label: 'View Notes', icon: NotesIcon, onClick: row => { setDetailLead(row); setNoteText(''); } },
    { key: 'archive', label: 'Mark Lost / Reopen', icon: ArchiveIcon, onClick: row => { setRowToToggle(row); setConfirmModalOpen(true); } },
  ];

  return (
    <div className="p-2">
      <PageHeader
        title="Leads"
        subtitle="Track and manage leads."
        actions={
          hasPermission('create_leads') && (
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm font-medium" onClick={() => { setEditData(null); setModalFields(initialFields); loadCampaigns(); setModalOpen(true); }}>
              Add Lead
            </button>
          )
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
                <Input label="Campaign (optional)" name="campigne" type="select" value={modalFields.campigne} onChange={e => setModalFields(p => ({ ...p, campigne: e.target.value }))} options={campaignOptions} />
                <Input label="Status" name="status" type="select" value={modalFields.status} onChange={e => setModalFields(p => ({ ...p, status: e.target.value }))} options={statusSelectOptions} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Meeting Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={modalFields.nextMeetingDate} onChange={e => setModalFields(p => ({ ...p, nextMeetingDate: e.target.value }))} />
                </div>
              </div>
              <Input label="Add Note" name="note" type="textarea" placeholder="Any notes about this lead..." value={modalFields.note} onChange={e => setModalFields(p => ({ ...p, note: e.target.value }))} />
            </form>
          )}
      </Modal>

      {/* Notes Slide-Over Panel */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={(e) => { if (e.target === e.currentTarget) setDetailLead(null); }}>
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                {leadLabel(detailLead)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{leadLabel(detailLead)}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR_MAP[detailLead.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL_MAP[detailLead.status] || detailLead.status}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full p-2" onClick={() => setDetailLead(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Notes Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!Array.isArray(detailLead.notes) || detailLead.notes.length === 0) ? (
                <div className="text-center text-sm text-gray-400 py-8">No notes yet. Add the first note below.</div>
              ) : detailLead.notes.map((note, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
                    {(note.addedBy?.name || 'U')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{note.addedBy?.name || 'Team Member'}</span>
                      {note.addedAt && <span className="text-xs text-gray-400">{new Date(note.addedAt).toLocaleString()}</span>}
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100">{note.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Note */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handleAddNote} className="flex gap-3 items-end">
                <textarea
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  rows={2}
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(e); } }}
                />
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors shrink-0"
                >
                  {addingNote ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : 'Add Note'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setRowToToggle(null); }}
        onConfirm={handleArchive}
        title="Update Lead Status"
        message={<>Mark as <span className="font-semibold">{rowToToggle?.status === 'lost' ? '"Created"' : '"Lost"'}</span>?</>}
        confirmLabel="Confirm"
        variant="warning"
      />
    </div>
  );
};

export default EmployeeLeads;
