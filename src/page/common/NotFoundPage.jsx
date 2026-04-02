import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFoundPage = () => {
  const { isAuthenticated, userType } = useAuth();
  const dashboardPath = isAuthenticated ? `/${userType}/dashboard` : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md w-full">
        <div className="text-8xl font-black text-emerald-100 mb-4 select-none leading-none">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {isAuthenticated ? 'Back to Dashboard' : 'Go to Login'}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
