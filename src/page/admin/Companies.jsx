import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
} from '../../api/companyAndPackageApi';
import { fetchRoles, fetchPermissions, createCredentials, } from '../../api/rolePermissionsApi';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const VerifiedBadge = ({ isVerified }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {isVerified ? (
        <>
          <svg className="w-3 h-3 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified
        </>
      ) : (
        'Unverified'
      )}
    </span>
  );
};

const Companies = () => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);

  const initialFields = {
    name: '', email: '', address: '', phone: '', logo: '',
    instagram: '', facebook: '', twitter: '', linkedin: '',
    isVerified: false
  };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('name');
  const [status, setStatus] = useState('');

  const getCompanies = async (params = {}) => {
    try {
      setLoading(true);
      const data = await fetchCompanies({
        page,
        pageSize,
        search: searchText,
        status,
        ...params,
      });
      const items = Array.isArray(data.data) ? data.data : data;
      setValues(items.map(item => ({ ...item, time: item.createdAt })));
      setTotal(data.total || items.length);
    } catch (err) {
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCompanies();
    // eslint-disable-next-line
  }, [page, pageSize, searchText, status]);

  const handleAdd = () => {
    setEditData(null);
    setModalFields(initialFields);
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setModalLoading(true);
    try {
      if (editData) {
        await updateCompany(editData._id, modalFields);
        toast.success('Company information updated successfully');
      } else {
        await createCompany(modalFields);
        toast.success('Company registered successfully');
      }
      setModalOpen(false);
      getCompanies();
    } catch (e) {
      toast.error('Failed to save company information');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRowAction = async (action, row) => {
    if (action === 'edit') {
      setEditData(row);
      setModalFields({
        name: row.name || '',
        email: row.email || '',
        address: row.address || '',
        phone: row.phone || '',
        logo: row.logo || '',
        instagram: row.instagram || '',
        facebook: row.facebook || '',
        twitter: row.twitter || '',
        linkedin: row.linkedin || '',
        isVerified: row.isVerified || false
      });
      setModalOpen(true);
    } else if (action === 'status') {
      setLoading(true);
      await updateCompany(row._id, { status: row.status === 1 ? 0 : 1 });
      getCompanies();
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
    { key: 'logo', label: '', type: 'image' }, // Visual only Column
    { key: 'name', label: 'Company Name', searchable: true },
    { key: 'email', label: 'Email', searchable: true },
    { key: 'phone', label: 'Phone', searchable: true },
    {
      key: 'isVerified',
      label: 'Verification',
      render: (isVerified) => <VerifiedBadge isVerified={isVerified} />
    },
    {
      key: 'status',
      label: 'Status',
      filter: {
        options: statusOptions,
        value: status,
        onChange: setStatus,
      },
      searchable: false,
      type: 'status',
      valueMap: { 0: 'Inactive', 1: 'Active' },
    },
    {
      key: 'createdAt',
      label: 'Added On',
      format: 'date'
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

  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [credentialsFields, setCredentialsFields] = useState({
    userId: '',
    password: '',
    role: '',
    permissions: [],
  });
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  const openCredentialsModal = async (editData = null) => {
    try {
      setCredentialsLoading(true);
      const fetchedRolesResponse = await fetchRoles();
      const fetchedPermissionsResponse = await fetchPermissions();

      const fetchedRoles = fetchedRolesResponse.data || [];
      const fetchedPermissions = fetchedPermissionsResponse.data || [];

      if (!Array.isArray(fetchedRoles)) {
        console.error('Error: Roles API did not return an array:', fetchedRolesResponse);
        throw new Error('Failed to fetch roles. Please check the API response.');
      }

      if (!Array.isArray(fetchedPermissions)) {
        console.error('Error: Permissions API did not return an array:', fetchedPermissionsResponse);
        throw new Error('Failed to fetch permissions. Please check the API response.');
      }

      setRoles(fetchedRoles);
      setPermissions(fetchedPermissions);

      if (editData) {
        setCredentialsFields({
          userId: editData.userId || '',
          password: '', // Keep password empty for security reasons
          role: editData.role || '',
          permissions: editData.permissions || [],
        });
      } else {
        setCredentialsFields({
          userId: '',
          password: '',
          role: '',
          permissions: [],
        });
      }

      setCredentialsModalOpen(true);
    } catch (error) {
      console.error('Error fetching roles or permissions:', error);
      toast.error('Failed to fetch roles or permissions. Please try again later.');

      // Open modal with empty roles and permissions
      setRoles([]);
      setPermissions([]);
      setCredentialsFields({
        userId: '',
        password: '',
        role: '',
        permissions: [],
      });
      setCredentialsModalOpen(true);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleCredentialsSubmit = async () => {
    setCredentialsLoading(true);
    try {
      const payload = {
        userId: credentialsFields.userId,
        password: credentialsFields.password,
        role: credentialsFields.role,
        permissions: credentialsFields.permissions, // Ensure permissions are included in the payload
      };

      if (!payload.permissions || payload.permissions.length === 0) {
        throw new Error('At least one permission must be selected.');
      }

      await createCredentials(payload);
      toast.success('Credentials created successfully');
      setCredentialsModalOpen(false);
    } catch (error) {
      console.error('Error creating credentials:', error);
      toast.error(error.message || 'Failed to create credentials');
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handlePermissionChange = (permissionId, isChecked) => {
    setCredentialsFields((prevFields) => {
      const updatedPermissions = isChecked
        ? [...prevFields.permissions.filter((id) => id !== null), permissionId] // Ensure no null values are added
        : prevFields.permissions.filter((id) => id !== permissionId && id !== null); // Remove the unselected permission and null values

      return {
        ...prevFields,
        permissions: updatedPermissions,
      };
    });
  };

  return (
    <div className="p-2">
      <ToastContainer />
      <PageHeader
        title="Companies directory"
        
        actions={
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm font-medium"
              onClick={handleAdd}
            >
              Add Company
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm font-medium"
              onClick={openCredentialsModal}
            >
              Create Credentials
            </button>
          </div>
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

      {/* Add / Edit Company Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Company Profile' : 'Register New Company'}
        size="xl"
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="company-form"
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all shadow-sm"
              >
                {editData ? 'Save Changes' : 'Register Company'}
              </button>
            </div>
          )
        }
      >
        {modalLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <form id="company-form" onSubmit={(e) => { e.preventDefault(); handleModalSubmit(); }} className="space-y-6">

            {/* Profile Registration */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Core Identity</h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <Input
                    label="Company Logo URL"
                    name="logo"
                    type="image" // Use our visual image preview fallback if string given
                    value={modalFields.logo}
                    onChange={(e) => setModalFields({ ...modalFields, logo: e.target.value })}
                  />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Company Name"
                      name="name"
                      placeholder="e.g. Acme Corp"
                      value={modalFields.name}
                      onChange={(e) => setModalFields({ ...modalFields, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Contact Email"
                      name="email"
                      type="email"
                      placeholder="admin@acme.com"
                      value={modalFields.email}
                      onChange={(e) => setModalFields({ ...modalFields, email: e.target.value.toLowerCase() })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      value={modalFields.phone}
                      onChange={(e) => setModalFields({ ...modalFields, phone: e.target.value })}
                    />
                    <div className="flex items-center h-full pt-6">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={modalFields.isVerified} onChange={(e) => setModalFields({ ...modalFields, isVerified: e.target.checked })} />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${modalFields.isVerified ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${modalFields.isVerified ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                        <div className="ml-3 font-medium text-sm text-gray-700">Account Verified</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Physical Address"
                name="address"
                type="textarea"
                placeholder="123 Corporate Blvd, Suite 400..."
                value={modalFields.address}
                onChange={(e) => setModalFields({ ...modalFields, address: e.target.value })}
              />
            </div>

            {/* Social Profiles */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Social Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <Input
                  label="LinkedIn URL"
                  name="linkedin"
                  placeholder="linkedin.com/company/acme"
                  value={modalFields.linkedin}
                  onChange={(e) => setModalFields({ ...modalFields, linkedin: e.target.value })}
                  className="mb-0"
                />
                <Input
                  label="Twitter / X"
                  name="twitter"
                  placeholder="twitter.com/acme"
                  value={modalFields.twitter}
                  onChange={(e) => setModalFields({ ...modalFields, twitter: e.target.value })}
                  className="mb-0"
                />
                <Input
                  label="Instagram"
                  name="instagram"
                  placeholder="instagram.com/acme"
                  value={modalFields.instagram}
                  onChange={(e) => setModalFields({ ...modalFields, instagram: e.target.value })}
                  className="mb-0"
                />
                <Input
                  label="Facebook"
                  name="facebook"
                  placeholder="facebook.com/acme"
                  value={modalFields.facebook}
                  onChange={(e) => setModalFields({ ...modalFields, facebook: e.target.value })}
                  className="mb-0"
                />
              </div>
            </div>

          </form>
        )}
      </Modal>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={handleCancelToggle}
        onConfirm={handleConfirmToggle}
        title="Change Status"
        message={
          <>
            Are you sure you want to change the status for <span className="font-semibold text-gray-800">"{rowToToggle?.name}"</span>?
          </>
        }
        confirmLabel="Confirm Update"
      />

      {/* Create Credentials Modal */}
      <Modal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        title="Create Credentials"
        size="lg"
        footer={
          !credentialsLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                onClick={() => setCredentialsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="credentials-form"
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-sm"
              >
                Create
              </button>
            </div>
          )
        }
      >
        {credentialsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form id="credentials-form" onSubmit={(e) => { e.preventDefault(); handleCredentialsSubmit(); }} className="space-y-6">
            <Input
              label="User ID"
              name="userId"
              placeholder="Enter user ID"
              value={credentialsFields.userId}
              onChange={(e) => setCredentialsFields({ ...credentialsFields, userId: e.target.value })}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={credentialsFields.password}
              onChange={(e) => setCredentialsFields({ ...credentialsFields, password: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={credentialsFields.role}
                onChange={(e) => setCredentialsFields({ ...credentialsFields, role: e.target.value })}
                required
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <div className="grid grid-cols-2 gap-4">
                {permissions.map(permission => (
                  <label key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={credentialsFields.permissions.includes(permission.id)}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{permission.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Companies;
