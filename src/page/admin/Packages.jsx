import React, { useEffect, useState } from 'react';

import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import {
  fetchPackages,
  createPackage,
  updatePackage,
} from '../../api/companyAndPackageApi';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
];

const Packages = () => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [editData, setEditData] = useState(null);
  const [rowToToggle, setRowToToggle] = useState(null);
  const [modalFields, setModalFields] = useState({
    name: '',
    price: '',
    totalCredits: '',
    offering: [] // { feature: "", enabled: true }
  });
  const [newFeatureName, setNewFeatureName] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('name');
  const [status, setStatus] = useState('');

  const getPackages = async (params = {}) => {
    try {
      setLoading(true);
      const data = await fetchPackages({
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
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPackages();
    // eslint-disable-next-line
  }, [page, pageSize, searchText, status]);

  const handleAdd = () => {
    setEditData(null);
    setModalFields({ name: '', price: '', totalCredits: '', offering: [] });
    setNewFeatureName("");
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setModalLoading(true);
    try {
      // Ensure Price and TotalCredits are Numbers, as API rejects string values
      const payload = {
        ...modalFields,
        price: Number(modalFields.price),
        totalCredits: Number(modalFields.totalCredits)
      };

      if (editData) {
        await updatePackage(editData._id, payload);
      } else {
        await createPackage(payload);
      }
      setModalOpen(false);
      getPackages();
    } catch (e) {
      alert('Failed to save package');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRowAction = async (action, row) => {
    if (action === 'edit') {
      setEditData(row);
      setModalFields({
        name: row.name || '',
        price: row.price || '',
        totalCredits: row.totalCredits || '',
        offering: row.offering || []
      });
      setNewFeatureName("");
      setModalOpen(true);
    } else if (action === 'status') {
      setLoading(true);
      await updatePackage(row._id, { status: row.status === 1 ? 0 : 1 });
      getPackages();
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

  // Custom Offering list management functions
  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    setModalFields(prev => ({
      ...prev,
      offering: [...prev.offering, { feature: newFeatureName.trim(), enabled: true }]
    }));
    setNewFeatureName("");
  };

  const handleToggleFeature = (index) => {
    setModalFields(prev => {
      const newOffering = [...prev.offering];
      newOffering[index].enabled = !newOffering[index].enabled;
      return { ...prev, offering: newOffering };
    });
  };

  const handleRemoveFeature = (index) => {
    setModalFields(prev => {
      const newOffering = [...prev.offering];
      newOffering.splice(index, 1);
      return { ...prev, offering: newOffering };
    });
  };


  const tableHeaders = [
    { key: 'name', label: 'Package Name', searchable: true },
    { key: 'price', label: 'Price', format: 'currency', currency: 'USD' },
    { key: 'totalCredits', label: 'Total Credits', format: 'number' },
    {
      key: 'offering',
      label: 'Features',
      render: (offering) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          {Array.isArray(offering) ? offering.filter(o => o.enabled).length : 0} Enabled
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
        title="Packages"
        actions={
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            onClick={handleAdd}
          >
            Add Package
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

      {/* Add/Edit Package Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Package Info' : 'Create New Package'}
        size="lg"
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
                form="package-form"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all shadow-sm"
              >
                {editData ? 'Save Changes' : 'Create Package'}
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
          <form id="package-form" onSubmit={(e) => { e.preventDefault(); handleModalSubmit(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Package Name"
                name="name"
                placeholder="e.g. Pro Monthly"
                value={modalFields.name}
                onChange={(e) => setModalFields({ ...modalFields, name: e.target.value })}
                required
              />
              <Input
                label="Price"
                name="price"
                type="price"
                currency="$"
                placeholder="29.99"
                value={modalFields.price}
                onChange={(e) => setModalFields({ ...modalFields, price: e.target.value })}
                required
                min="0"
              />
            </div>

            <Input
              label="Total Credits"
              name="totalCredits"
              type="number"
              placeholder="e.g. 500"
              value={modalFields.totalCredits}
              onChange={(e) => setModalFields({ ...modalFields, totalCredits: e.target.value })}
              required
              min="0"
            />

            <hr className="my-6 border-gray-100" />

            {/* Offerings list mapping */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Package Offerings (Features)</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      name="newFeature"
                      placeholder="e.g. 24/7 Priority Support"
                      value={newFeatureName}
                      onChange={(e) => setNewFeatureName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="mb-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors h-10.5 mt-1"
                  >
                    Add
                  </button>
                </div>

                {modalFields.offering.length > 0 ? (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {modalFields.offering.map((offer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <span className={`text-sm font-medium ${offer.enabled ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                          {offer.feature}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(idx)}
                            className={`text-xs px-2 py-1 rounded-md font-medium border ${offer.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                          >
                            {offer.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No features added yet.
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Status Toggle Dialog */}
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
    </div>
  );
};

export default Packages;
