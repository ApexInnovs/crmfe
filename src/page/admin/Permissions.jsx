

import React, { useEffect, useState } from 'react';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import useFeedback from "../../hooks/useFeedback";
// Helper to show relative time in words
function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

import Table from '../../components/common/Table';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from '../../api/rolePermissionsApi';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const Permissions = () => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fire } = useFeedback();
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToToggle, setRowToToggle] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [editData, setEditData] = useState(null);
  const [modalFields, setModalFields] = useState({ name: '', meta: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('name');
  const [status, setStatus] = useState('');

  // Handler to update status and fetch permissions
  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(1); // Reset to first page on filter
    // Do NOT call getPermissions here; let useEffect handle it
  };

  // Form validation state
  const [touched, setTouched] = useState({ name: false, meta: false });
  const [formError, setFormError] = useState({ name: '', meta: '' });

  // Reset validation state when modal opens/closes
  useEffect(() => {
    if (modalOpen) {
      setTouched({ name: false, meta: false });
      setFormError({ name: '', meta: '' });
    }
  }, [modalOpen]);

  const getPermissions = async (params = {}) => {
    try {
      setLoading(true);
      const data = await fetchPermissions({
        page,
        pageSize,
        search: searchText,
        status,
        ...params,
      });
      // Assume API returns { data: [], total: number }
      const items = Array.isArray(data.data) ? data.data : data;
      setValues(items.map(item => ({ ...item, time: item.createdAt })));
      setTotal(data.total || items.length);
    } catch (err) {
      setError('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPermissions();
    // eslint-disable-next-line
  }, [page, pageSize, searchText, status]);

  const handleAdd = () => {
    setEditData(null);
    setModalFields({ name: '', meta: '' });
    setModalOpen(true);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setModalFields((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFormError((prev) => ({ ...prev, [name]: value ? '' : 'Required' }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const newTouched = { name: true, meta: true };
    setTouched(newTouched);
    const newError = {
      name: modalFields.name ? '' : 'Required',
      meta: modalFields.meta ? '' : 'Required',
    };
    setFormError(newError);
    if (!modalFields.name || !modalFields.meta) return;

    setModalLoading(true);
    try {
      if (editData) {
        await updatePermission(editData._id, modalFields);
      } else {
        await createPermission(modalFields);
      }
      setModalOpen(false);
      getPermissions();
    } catch (e) {
      alert('Failed to save permission');
    } finally {
      setModalLoading(false);
    }
  };


  // Table row actions
  const handleRowAction = async (action, row) => {
    if (action === 'edit') {
      setEditData(row);
      setModalFields({ name: row.name || '', meta: row.meta || '' });
      setModalOpen(true);
    } else if (action === 'delete') {
      setRowToDelete(row);
      setDeleteConfirmOpen(true);
    } else if (action === 'status') {
      setLoading(true);
      await updatePermission(row._id, { status: row.status === 1 ? 0 : 1 });
      getPermissions();
    }
  };

  const hapticTap = () => fire({ haptic: [{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }], sound: true });
  // Table headers with filter for status and searchable keys
  const tableHeaders = [
    { key: 'name', label: 'Name', searchable: true },
    { key: 'meta', label: 'Meta', searchable: true },
    {
      key: 'status',
      label: 'Status',
      filter: {
        options: statusOptions,
        value: status,
        onChange: handleStatusChange,
      },
      searchable: true,
      type: 'status', // use built-in status renderer
      valueMap: { 0: 'Inactive', 1: 'Active' },
    },
  ];

  // Action icons
  const EditIcon = <Pencil size={18} color="#059669" strokeWidth={2.2} style={{ background: '#e6fbe6', borderRadius: 6, padding: 2 }} />;
  const StatusIcon = <RefreshCw size={18} color="#059669" strokeWidth={2.2} style={{ background: '#e6fbe6', borderRadius: 6, padding: 2 }} />;
  const DeleteIcon = <Trash2 size={18} color="#dc2626" strokeWidth={2.2} style={{ background: '#ffeaea', borderRadius: 6, padding: 2 }} />;
  const actions = [
    {
      key: 'edit',
      label: 'Edit',
      icon: EditIcon,
      onClick: row => { hapticTap(); handleRowAction('edit', row); },
    },
    {
      key: 'status',
      label: 'Toggle Status',
      icon: StatusIcon,
      onClick: row => { hapticTap(); setRowToToggle(row); setConfirmModalOpen(true); },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: DeleteIcon,
      variant: 'danger',
      onClick: row => { hapticTap(); handleRowAction('delete', row); },
    }
  ];

  const handleConfirmToggle = () => {
    if (rowToToggle) {
      handleRowAction('status', rowToToggle);
    }
    setConfirmModalOpen(false);
    setRowToToggle(null);
  };

  const handleCancelToggle = () => {
    setConfirmModalOpen(false);
    setRowToToggle(null);
  };

  const handleConfirmDelete = async () => {
    if (rowToDelete) {
      setLoading(true);
      await deletePermission(rowToDelete._id);
      getPermissions();
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };


  return (
    <div className="px-2">
      {/* Search bar and Add Permission button */}
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
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={searchKey}
            onChange={e => setSearchKey(e.target.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 14px',
              background: 'linear-gradient(175deg, #ffffff 0%, #eff1ee 100%)',
              borderRadius: '10px',
              border: '1px solid rgba(180,190,175,0.6)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13.5px',
              fontWeight: '500',
              color: '#374140',
              outline: 'none',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {tableHeaders.filter(h => h.searchable).map((h) => (
              <option key={h.key} value={h.key}>{h.label}</option>
            ))}
          </select>

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
              onChange={e => setSearchText(e.target.value)}
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
        </div>

        <button
          onClick={() => { hapticTap(); handleAdd(); }}
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
          Add Permission
        </button>
      </div>

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
        onRowAction={handleRowAction}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Permission' : 'Add New Permission'}
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all cursor-pointer"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="permission-form"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all shadow-sm cursor-pointer"
              >
                {editData ? 'Save Changes' : 'Create Permission'}
              </button>
            </div>
          )
        }
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : (
          <form id="permission-form" onSubmit={handleModalSubmit} className="space-y-2">
            <Input
              label="Permission Name"
              name="name"
              placeholder="e.g. read_users"
              value={modalFields.name || ''}
              onChange={handleFieldChange}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              error={touched.name && formError.name ? formError.name : ''}
              required
            />
            <Input
              label="Meta Description"
              name="meta"
              type="textarea"
              placeholder="Describe what this permission allows..."
              value={modalFields.meta || ''}
              onChange={handleFieldChange}
              onBlur={() => setTouched((prev) => ({ ...prev, meta: true }))}
              error={touched.meta && formError.meta ? formError.meta : ''}
              required
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        title="Change Status"
        message={<>Are you sure you want to change the status for <span className="font-semibold text-gray-800">"{rowToToggle?.name}"</span>?</>}
        confirmLabel="Confirm Update"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setRowToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Permission"
        message={<>Are you sure you want to delete <span className="font-semibold text-gray-800">"{rowToDelete?.name}"</span>? This action cannot be undone.</>}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Permissions;
