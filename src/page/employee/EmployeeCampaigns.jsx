import React, { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getCampaignsByCompany } from '../../api/campigneAndLeadApi';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 1, label: 'Active' },
  { value: 2, label: 'Started' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
];

const STATUS_LABELS = { 1: 'Active', 2: 'Started', 3: 'Completed', 4: 'Cancelled' };
const STATUS_COLORS = {
  1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  2: 'bg-blue-100 text-blue-700 border-blue-200',
  3: 'bg-gray-100 text-gray-600 border-gray-200',
  4: 'bg-red-100 text-red-700 border-red-200',
};

const EmployeeCampaigns = () => {
  const { user } = useAuth();
  const companyId = user.company?._id || user.company;

  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchKey, setSearchKey] = useState('title');
  const [status, setStatus] = useState('');

  const loadCampaigns = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await getCampaignsByCompany(companyId, { page, limit: pageSize, search: searchText, status });
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setValues(items);
      setTotal(data.total || items.length);
    } catch (_) {
      setValues([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, [page, pageSize, searchText, status]);

  const tableHeaders = [
    { key: 'title', label: 'Title', searchable: true },
    { key: 'description', label: 'Description', render: v => <span className="text-xs text-gray-500">{v || '—'}</span> },
    {
      key: 'formStructure', label: 'Fields',
      render: v => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {Array.isArray(v) ? v.length : 0} fields
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      filter: { options: STATUS_OPTIONS, value: status, onChange: setStatus },
      render: v => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[v] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {STATUS_LABELS[v] || v || '—'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', format: 'date' },
  ];

  return (
    <div className="p-2">
      <PageHeader
        title="Campaigns"
        subtitle="View your company's campaigns."
      />

      <Table
        headers={tableHeaders} values={values} total={total} page={page} pageSize={pageSize}
        searchKeys={['title']} searchKey={searchKey} onSearchKeyChange={setSearchKey}
        searchText={searchText} onSearchTextChange={setSearchText}
        loading={loading} onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        actions={[]}
      />
    </div>
  );
};

export default EmployeeCampaigns;
