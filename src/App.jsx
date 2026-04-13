import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layout/mainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotFoundPage from "./page/common/NotFoundPage";
import LoginPage from "./page/common/LoginPage";
import PublicCampaignPage from "./page/company/PublicCampaignPage";
import Loader from "./components/common/Loader";
import { useAuth } from "./context/AuthContext";
import companyRoutes from "./routes/companyRoutes";

function App() {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#84cc16',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* SVG filter definitions for modal grain effect */}
      <svg style={{ position: 'absolute', width: '0', height: '0' }} aria-hidden="true">
        <defs>
          <filter id="modal-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.70"
              numOctaves="4"
              stitchTiles="stitch"
              result="turbulence"
            />
            <feColorMatrix type="saturate" values="0" result="gray" />
            <feBlend mode="overlay" in="gray" in2="SourceGraphic" />
          </filter>
        </defs>
      </svg>

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

            {/* Company routes - each page at its own URL path */}
            <Route path="/company" element={
              <ProtectedRoute allowedUserTypes={['company']}>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              {companyRoutes.map(route => (
                <Route
                  key={route.id}
                  path={route.path}
                  element={
                    <Suspense fallback={<Loader />}>
                      <route.component />
                    </Suspense>
                  }
                />
              ))}
            </Route>

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
    </>
  );
}

export default App;
