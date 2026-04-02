import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin } from '../api/employeeAndAdminApi';
import { loginEmployee } from '../api/employeeAndAdminApi';
import { LoginCompany } from '../api/companyAndPackageApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    token: null,
    userType: null,
    permissions: [],
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');
    const permsStr = localStorage.getItem('permissions');

    if (token && userStr && userType) {
      try {
        const user = JSON.parse(userStr);
        const permissions = permsStr ? JSON.parse(permsStr) : [];
        setState({ user, token, userType, permissions, isAuthenticated: true, loading: false });
      } catch {
        localStorage.clear();
        setState(s => ({ ...s, loading: false }));
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const login = async (userType, credentials) => {
    let response;
    if (userType === 'admin') {
      response = await loginAdmin(credentials);
    } else if (userType === 'company') {
      response = await LoginCompany(credentials);
    } else {
      response = await loginEmployee(credentials);
    }

    const token = response.token;
    const user = response.admin || response.company || response.employee;

    let permissions = [];
    if (userType === 'employee' && response.employee?.role?.permissions) {
      permissions = response.employee.role.permissions.map(p =>
        typeof p === 'object' ? p.name : p
      );
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userType', userType);
    localStorage.setItem('permissions', JSON.stringify(permissions));

    setState({ user, token, userType, permissions, isAuthenticated: true, loading: false });
    return userType;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('permissions');
    setState({ user: null, token: null, userType: null, permissions: [], isAuthenticated: false, loading: false });
  };

  const hasPermission = (permissionName) => {
    if (state.userType === 'admin' || state.userType === 'company') return true;
    return state.permissions.includes(permissionName);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
