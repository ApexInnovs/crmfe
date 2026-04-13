import React, { useEffect, useRef, useState } from 'react';
import Table from '../../components/common/Table';
import SkeletonLoader from '../../components/common/Skeleton';
import Input from '../../components/common/Input';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [passwordError, setPasswordError] = useState('');


  const validatePassword = (password) => {
    if (!password) return '';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
    return '';
  };

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
    if (values.length >= 1) {
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
    if (k === 'password') {
      setPasswordError(validatePassword(value));
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Name', searchable: true },
    { key: 'email', label: 'Email', searchable: true },
    { key: 'phone', label: 'Phone' },
    {
      key: 'role', label: 'Role',
      render: v => v?.name
        ? <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-br from-rose-50 to-rose-100 text-rose-700 border border-rose-200 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default"
          style={{
            boxShadow: '0 0 16px rgba(244, 63, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(244, 63, 94, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 0 16px rgba(244, 63, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
          }}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" style={{ boxShadow: '0 0 6px rgba(244, 63, 94, 0.5)' }} />
          {v.name}
        </span>
        : <span className="text-xs text-gray-400">—</span>
    },
    {
      key: 'status', label: 'Status', type: 'status', valueMap: { 0: 'Inactive', 1: 'Active' },
      filter: { options: statusOptions, value: status, onChange: setStatus },
      render: v => {
        const statusStyles = {
          1: { label: 'Active', bgGradient: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', glow: 'rgba(16, 185, 129, 0.15)' },
          0: { label: 'Inactive', bgGradient: 'from-slate-50 to-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400', glow: 'rgba(100, 116, 139, 0.15)' },
        };
        const style = statusStyles[v] || statusStyles[1];
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-br ${style.bgGradient} ${style.text} border ${style.border} transition-all duration-300 hover:shadow-md hover:scale-105 cursor-default`}
            style={{
              boxShadow: `0 0 16px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 0 20px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = `0 0 16px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`;
            }}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot}`} style={{ boxShadow: `0 0 6px ${style.glow}` }} />
            {style.label}
          </span>
        );
      },
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

        {/* Add Employee Button */}
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
          Add Employee
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          actions={actions}
        />
      )}

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
              {(() => {
                const phone = modalFields.phone;
                const isPhoneValid = phone === '' || /^[789]\d{9}$/.test(phone);
                const isPasswordMatch = modalFields.password === modalFields.confirmPassword;
                const isButtonDisabled = !isPhoneValid || !isPasswordMatch || !!passwordError;
                return (
                  <button
                    type="submit"
                    form="employee-form"
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${isButtonDisabled ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'text-white bg-emerald-600 hover:bg-emerald-700'}`}
                    disabled={isButtonDisabled}
                  >
                    {editData ? "Save Changes" : "Add Employee"}
                  </button>
                );
              })()}
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
                  placeholder="9876543210"
                  value={modalFields.phone}
                  onChange={f("phone")}
                  error={
                    modalFields.phone &&
                      !/^[789]\d{9}$/.test(modalFields.phone)
                      ? 'Enter a valid 10-digit Indian number starting with 7, 8, or 9.'
                      : ''
                  }
                  maxLength={10}
                />
              </div>

              {roles.length === 1 ? (
                (() => {
                  if (modalFields.role !== roles[0]._id) {
                    setModalFields((prev) => ({ ...prev, role: roles[0]._id }));
                  }
                  return (
                    <div className="py-0.1">
                      <Input
                        label="Role"
                        name="role"
                        type="text"
                        value={roles[0].name}
                        readOnly
                        disabled
                      />
                    </div>
                  );
                })()
              ) : (
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
              )}
              <div className="py-0.1 relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={modalFields.password}
                  onChange={f("password")}
                  required={!editData}
                  error={passwordError}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {passwordError && (
                  <div className="text-xs text-red-500 mt-1">{passwordError}</div>
                )}
              </div>
              <div className="py-0.1 relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={modalFields.confirmPassword}
                  onChange={f("confirmPassword")}
                  required={!editData}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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