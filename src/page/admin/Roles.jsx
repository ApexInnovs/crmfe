import React, { useEffect, useState } from 'react';

import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import {
  fetchRoles,
  createRole,
  updateRole,
  fetchPermissions,
} from '../../api/rolePermissionsApi';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const Roles = () => {
  const [values, setValues] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);
  const [modalFields, setModalFields] = useState({ name: '', permissions: [] });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('name');
  const [status, setStatus] = useState('');

  // 1. Fetch available permissions for the Multiselect dropdown
  const loadPermissions = async () => {
    try {
      // Fetch all permissions (you might need to adjust pagination to get all if there are many)
      const data = await fetchPermissions({ page: 1, pageSize: 100, status: 1 });
      const items = Array.isArray(data.data) ? data.data : data;
      // Map them into the format our Multiselect logic supports: { label, value }
      const formattedOptions = items.map(p => ({
        label: p.name,
        value: p._id
      }));
      setPermissionsList(formattedOptions);
    } catch (err) {
      console.error('Failed to load permissions list:', err);
    }
  };

  // 2. Fetch the Roles table data
  const getRoles = async (params = {}) => {
    try {
      setLoading(true);
      const data = await fetchRoles({
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
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    getRoles();
    // eslint-disable-next-line
  }, [page, pageSize, searchText, status]);

  const handleAdd = () => {
    setEditData(null);
    setModalFields({ name: '', permissions: [] });
    setModalOpen(true);
  };

  const handleModalSubmit = async (fields) => {
    setModalLoading(true);
    try {
      if (editData) {
        // Update role with permissions
        await updateRole(editData._id, fields);
      } else {
        // Create new role with permissions
        await createRole(fields);
      }
      setModalOpen(false);
      getRoles();
    } catch (e) {
      alert('Failed to save role. Please check your input and try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRowAction = async (action, row) => {
    if (action === 'edit') {
      setEditData(row);
      const selectedPerms = row.permissions
        ? row.permissions.map(p => (typeof p === 'object' ? p._id : p))
        : [];
      setModalFields({ name: row.name || '', permissions: selectedPerms });
      setModalOpen(true);
    } else if (action === 'status') {
      setLoading(true);
      try {
        await updateRole(row._id, { status: row.status === 1 ? 0 : 1 });
        getRoles();
      } catch (e) {
        alert('Failed to update role status.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmToggle = () => {
    if (rowToToggle) handleRowAction('status', rowToToggle);
    setConfirmModalOpen(false);
    setRowToToggle(null);
  };

  const handleCancelToggle = () => {
    setConfirmModalOpen(false);
    setRowToToggle(null);
  };

  const tableHeaders = [
    { key: 'name', label: 'Role Name', searchable: true },
    {
      key: 'permissions',
      label: 'Permissions Count',
      render: (perms) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {Array.isArray(perms) ? perms.length : 0} Assigned
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      filter: {
        options: statusOptions,
        value: status,
        onChange: setStatus,
      },
      searchable: true,
      type: 'status',
      valueMap: { 0: 'Inactive', 1: 'Active' },
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (value) => (
        <span style={{ color: '#059669' }}>{new Date(value).toLocaleString()}</span>
      ),
    },
  ];

  const EditIcon = (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" />
    </svg>
  );

  const actions = [
    {
      key: 'edit',
      label: 'Edit',
      icon: EditIcon,
      onClick: row => handleRowAction('edit', row),
    },
    {
      key: 'status',
      label: 'Toggle Status',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      onClick: row => {
        setRowToToggle(row);
        setConfirmModalOpen(true);
      },
    }
  ];

  return (
    <div className="p-2">
      <PageHeader
        title="Roles"
        actions={
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            onClick={handleAdd}
          >
            Add Role
          </button>
        }
      />

      <Table
        headers={tableHeaders}
        values={values}
        total={total}
        page={page}
        pageSize={pageSize}
        searchKeys={tableHeaders.filter(h => h.searchable).map(h => h.key)}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={actions}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Role' : 'Add New Role'}
        size="md"
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="role-form"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all shadow-sm"
              >
                {editData ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          )
        }
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-emerald-600">Loading...</span>
          </div>
        ) : (
          <form id="role-form" onSubmit={(e) => { e.preventDefault(); handleModalSubmit(modalFields); }} className="space-y-4">
            <Input
              label="Role Name"
              name="name"
              placeholder="e.g. Support Admin"
              value={modalFields.name}
              onChange={(e) => setModalFields({ ...modalFields, name: e.target.value })}
              required
            />
            <Input
              label="Assign Permissions"
              name="permissions"
              type="multiselect"
              placeholder="Select permissions..."
              options={permissionsList}
              value={modalFields.permissions}
              onChange={(e) => setModalFields({ ...modalFields, permissions: e.target.value })}
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
    </div>
  );
};

export default Roles;
