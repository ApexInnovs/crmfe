import React from 'react';

const StatCard = ({ label, value, bgColor, icon, loading }) => {
  return (
    <div className={`p-4 border rounded ${bgColor}`}>
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-white shadow">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{label}</h3>
          <p className="text-lg font-bold text-gray-800">
            {loading ? 'Loading...' : value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;