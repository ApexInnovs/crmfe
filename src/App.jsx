import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/mainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotFoundPage from "./page/common/NotFoundPage";
import LoginPage from "./page/common/LoginPage";
import PublicCampaignPage from "./page/company/PublicCampaignPage";
import Loader from "./components/common/Loader";
import { useAuth } from "./context/AuthContext";

function App() {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated
              ? <Navigate to={`/${userType}`} replace />
              : <LoginPage />
          } />

          {/* Public campaign landing page */}
          <Route path="/campaign/:campaignId" element={<PublicCampaignPage />} />

          {/* Root redirect */}
          <Route path="/" element={
            isAuthenticated
              ? <Navigate to={`/${userType}`} replace />
              : <Navigate to="/login" replace />
          } />

          {/* Admin route - single page with tabs */}
          <Route path="/admin" element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <MainLayout />
            </ProtectedRoute>
          } />

          {/* Company route - single page with tabs */}
          <Route path="/company" element={
            <ProtectedRoute allowedUserTypes={['company']}>
              <MainLayout />
            </ProtectedRoute>
          } />

          {/* Employee route - single page with tabs */}
          <Route path="/employee" element={
            <ProtectedRoute allowedUserTypes={['employee']}>
              <MainLayout />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
