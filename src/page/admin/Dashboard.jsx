import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { fetchCompanies, fetchPackages } from '../../api/companyAndPackageApi';
import { fetchRoles, fetchPermissions } from '../../api/rolePermissionsApi';

const StatCard = ({ label, value, icon, bgColor, loading }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
    <div className={`p-3 rounded-xl shrink-0 ${bgColor}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {loading
        ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        : <p className="text-3xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
      }
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [co, packs, rolesData, permsData] = await Promise.allSettled([
          fetchCompanies({ page: 1, limit: 5 }),
          fetchPackages({ page: 1, limit: 1 }),
          fetchRoles({ page: 1, limit: 1 }),
          fetchPermissions({ page: 1, limit: 1 }),
        ]);
        setStats({
          companies: co.status === 'fulfilled' ? (co.value.total ?? co.value.data?.length ?? 0) : '—',
          packages: packs.status === 'fulfilled' ? (packs.value.total ?? packs.value.data?.length ?? 0) : '—',
          roles: rolesData.status === 'fulfilled' ? (rolesData.value.total ?? rolesData.value.data?.length ?? 0) : '—',
          permissions: permsData.status === 'fulfilled' ? (permsData.value.total ?? permsData.value.data?.length ?? 0) : '—',
        });
        if (co.status === 'fulfilled') {
          const items = Array.isArray(co.value.data) ? co.value.data : (Array.isArray(co.value) ? co.value : []);
          setRecentCompanies(items.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      label: 'Total Companies', value: stats.companies, bgColor: 'bg-blue-50',
      icon: <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    },
    {
      label: 'Active Packages', value: stats.packages, bgColor: 'bg-yellow-50',
      icon: <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    },
    {
      label: 'Total Roles', value: stats.roles, bgColor: 'bg-purple-50',
      icon: <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    },
    {
      label: 'Total Permissions', value: stats.permissions, bgColor: 'bg-emerald-50',
      icon: <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
    },
  ];

  return (
    <div className="p-2">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview — manage your SaaS from here."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>

      {/* Recent Companies */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Companies</h2>
        </div>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-1/5" /></div>
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentCompanies.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No companies yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentCompanies.map(company => (
              <div key={company._id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {(company.name || 'C')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{company.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{company.email} · {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '—'}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${company.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {company.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
