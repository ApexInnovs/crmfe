import React, { useEffect, useRef, useState } from 'react';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/employeeAndAdminApi';
import { fetchRoles } from '../../api/rolePermissionsApi';
import { assignLead, fetchUnassignedLeads, fetchEmployees } from '../../api/leadApi';
import { AddButton } from '../../components/common/Table';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const EditIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487a2.06 2.06 0 1 1 2.915 2.915L8.5 19.68l-4 1 1-4 13.362-13.193Z" /></svg>;
const ToggleIcon = <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-8v8m13-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

const SmartLeadAssignment = () => {

  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadData, employeeData] = await Promise.all([
          fetchUnassignedLeads(user.company._id),
          fetchEmployees(user.company._id),
        ]);
        setLeads(leadData);
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user.company._id]);

  const handleAssign = async () => {
    if (!selectedLead || !selectedEmployee) {
      alert('Please select both a lead and an employee.');
      return;
    }
    setLoading(true);
    try {
      await assignLead(selectedLead, selectedEmployee);
      alert('Lead assigned successfully!');
      setLeads((prev) => prev.filter((lead) => lead._id !== selectedLead));
      setSelectedLead('');
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error assigning lead:', error);
      alert('Failed to assign lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">Smart Lead Assignment</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Lead</label>
        <select
          value={selectedLead}
          onChange={(e) => setSelectedLead(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select Lead --</option>
          {leads.map((lead) => (
            <option key={lead._id} value={lead._id}>
              {lead.name || `Lead #${lead._id.slice(-6)}`}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Employee</label>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select Employee --</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAssign}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Assigning...' : 'Assign Lead'}
      </button>
    </div>
  );
};

const CompanyEmployees = () => {
  const { user } = useAuth();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const initialFields = { name: '', email: '', phone: '', role: '', password: '', confirmPassword: '' };
  const [modalFields, setModalFields] = useState(initialFields);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceTimeout = useRef();
  const [searchKey, setSearchKey] = useState("name");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const sortBy = "createdAt";
  const sortOrder = "desc";

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        company: user._id,
        sortBy,
        sortOrder,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status !== '') params.status = status;
      if (role) params.role = role;
      const data = await getEmployees(params);
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]);
    } finally {
      setLoading(false);
    }
  };

  // Only trigger load on debouncedSearch, not searchText
  useEffect(() => { load(); }, [page, pageSize, debouncedSearch, status, role, sortBy, sortOrder]);

  // Debounce searchText changes
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchText]);
  // (fixed) Removed stray params usage outside of function

  const loadSelectData = async () => {
    const [r] = await Promise.allSettled([
      fetchRoles({ limit: 100, type: 'company' }),
    ]);
    if (r.status === 'fulfilled') {
      const items = Array.isArray(r.value.data) ? r.value.data : (Array.isArray(r.value) ? r.value : []);
      setRoles(items);
    }
  };

  const handleAdd = () => {
    if (loading) {
      alert('Please wait, employee data is still loading.');
      return;
    }
    if (values.length >= 2) {
      setLimitModalOpen(true);
      return;
    }
    setEditData(null);
    setModalFields(initialFields);
    loadSelectData();
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalFields({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      role: row.role?._id || row.role || '',
      password: '',
      confirmPassword: '',
    });
    loadSelectData();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setModalLoading(true);
    try {
      if (editData) {
        // Only send changed fields
        const payload = {};
        if (modalFields.name !== editData.name) payload.name = modalFields.name;
        if (modalFields.email !== editData.email) payload.email = modalFields.email;
        if (modalFields.phone !== editData.phone) payload.phone = modalFields.phone;
        if ((editData.role?._id || editData.role) !== modalFields.role) payload.role = modalFields.role;
        if (modalFields.password) payload.password = modalFields.password;
        if (Object.keys(payload).length === 0) {
          setModalOpen(false);
          setModalLoading(false);
          return;
        }
        payload.company = user._id;
        await updateEmployee(editData._id, payload);
      } else {
        // For create, send only required fields
        const payload = {
          name: modalFields.name,
          email: modalFields.email,
          phone: modalFields.phone,
          role: modalFields.role,
          company: user._id,
          password: modalFields.password,
        };
        await createEmployee(payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!rowToToggle) return;
    setLoading(true);
    try {
      await updateEmployee(rowToToggle._id, { status: rowToToggle.status === 1 ? 0 : 1 });
    } finally {
      setConfirmModalOpen(false);
      setRowToToggle(null);
      load();
    }
  };

  const f = (k) => (e) => {
    const value = k === 'avatar' ? e.target.files[0] : e.target.value;
    setModalFields(p => ({ ...p, [k]: value }));
  };

  const tableHeaders = [
    { key: 'name', label: 'Name', searchable: true },
    { key: 'email', label: 'Email', searchable: true },
    { key: 'phone', label: 'Phone' },
    {
      key: 'role', label: 'Role',
      render: v => v?.name
        ? <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">{v.name}</span>
        : <span className="text-xs text-gray-400">—</span>
    },
    {
      key: 'status', label: 'Status', type: 'status', valueMap: { 0: 'Inactive', 1: 'Active' },
      filter: { options: statusOptions, value: status, onChange: setStatus },
    },
    { key: 'createdAt', label: 'Created', format: 'date' },
  ];

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete employee "${row.name}"?`)) return;
    setLoading(true);
    try {
      await deleteEmployee(row._id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { key: 'edit', label: 'Edit', icon: EditIcon, onClick: handleEdit },
    { key: 'status', label: 'Toggle Status', icon: ToggleIcon, onClick: row => { setRowToToggle(row); setConfirmModalOpen(true); } },
  ];

  const roleOptions = roles.map(r => ({ value: r._id, label: r.name }));

  return (
    <div className="p-2">
      
      <Table
        headers={tableHeaders}
        values={values}
        total={total}
        page={page}
        pageSize={pageSize}
        searchKeys={tableHeaders.filter((h) => h.searchable).map((h) => h.key)}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        actions={actions}
        onAdd={handleAdd}
        addLabel="Add Employee"
        // The Add button will now appear in the table toolbar next to the search bar
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? "Edit Employee" : "Add Employee"}
        footer={
          !modalLoading && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="employee-form"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${modalFields.password !== modalFields.confirmPassword ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'text-white bg-emerald-600 hover:bg-emerald-700'}`}
                disabled={modalFields.password !== modalFields.confirmPassword}
              >
                {editData ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          )
        }
      >
        {modalLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <form
            id="employee-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="py-0.1">
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                  value={modalFields.name}
                  onChange={f("name")}
                  required
                />
              </div>
              <div className="py-0.1">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={modalFields.email}
                  onChange={f("email")}
                  required
                />
              </div>
              <div className="py-0.1">
                <Input
                  label="Phone"
                  name="phone"
                  placeholder="+1 555 000 0000"
                  value={modalFields.phone}
                  onChange={f("phone")}
                />
              </div>
              <div className="py-0.1">
                <Input
                  label="Role"
                  name="role"
                  type="select"
                  value={modalFields.role}
                  onChange={f("role")}
                  options={roles.map((role) => ({ value: role._id, label: role.name }))}
                  placeholder="-- Select Role --"
                  required
                />
              </div>
              <div className="py-0.1">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={modalFields.password}
                  onChange={f("password")}
                  required={!editData}
                />
              </div>
              <div className="py-0.1">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={modalFields.confirmPassword}
                  onChange={f("confirmPassword")}
                  required={!editData}
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Employee Limit Modal */}
      <Modal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        title="Employee Limit Reached"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
              onClick={() => setLimitModalOpen(false)}
            >
              OK
            </button>
          </div>
        }
      >
        <div className="py-2 text-center text-gray-700">
          You have reached the employee limit for your company.<br />
          Please buy more credits and contact the developer to add more employees.
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setRowToToggle(null);
        }}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message={
          <>
            Change status for <span className="font-semibold text-gray-800">"{rowToToggle?.name}"</span>?
          </>
        }
        confirmLabel="Confirm"
      />
    </div>
  );
};

export default CompanyEmployees;
