import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { fetchPackages } from '../../api/companyAndPackageApi';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const CompanySubscription = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      try {
        const packagesData = await fetchPackages({ company: user._id });
        setPackages(Array.isArray(packagesData) ? packagesData : []);
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    loadPackages();
  }, [user._id]);

  // Purchase/upgrade logic removed (API not implemented)

  const tableHeaders = [
    { key: 'name', label: 'Package Name' },
    { key: 'description', label: 'Description' },
    { key: 'price', label: 'Price', format: 'currency' },
    { key: 'tokens', label: 'Tokens Included' },
  ];

  return (
    <div className="p-4">
      <PageHeader
        title="Subscription Packages"
        
      />
      <Table
        headers={tableHeaders}
        values={packages}
        loading={loading}
      />
    </div>
  );
};

export default CompanySubscription;