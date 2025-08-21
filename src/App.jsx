
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import GameCenter from '@/pages/GameCenter';
import SocialFeed from '@/pages/SocialFeed';
import Prediction from '@/pages/Prediction';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import AdminLayout from '@/components/AdminLayout';
import PredictionGame from '@/pages/PredictionGame';
import EmailConfirmation from '@/pages/EmailConfirmation';
import PointsCenter from '@/pages/PointsCenter';
import InvitePage from '@/pages/InvitePage';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminRoute from '@/components/AdminRoute';
import UserManagement from '@/pages/UserManagement';
import ContentModeration from '@/pages/ContentModeration';
import PointsHistory from '@/pages/PointsHistory';
import EditProfile from '@/pages/EditProfile';
import AdminSettings from '@/pages/AdminSettings';
import PageContentManager from '@/pages/PageContentManager';
import Notifications from '@/pages/Notifications';
import AdminNotifications from '@/pages/AdminNotifications';
import InvitationAnalytics from '@/pages/InvitationAnalytics';
import AdminCryptoDemo from '@/pages/AdminCryptoDemo';
import AdminSaasManagement from '@/pages/AdminSaasManagement';
import AuthCallback from '@/pages/AuthCallback';
import TenantAdminLayout from '@/components/TenantAdminLayout';
import TenantAdminRoute from '@/components/TenantAdminRoute';
import AdminSiteSettings from '@/pages/AdminSiteSettings';
import TenantContentManager from '@/pages/TenantContentManager';

const SuperAdminRoutes = () => (
  <Routes>
    <Route path="/" element={<AdminDashboard />} />
    <Route path="/users" element={<UserManagement />} />
    <Route path="/content" element={<ContentModeration />} />
    <Route path="/app-settings" element={<AdminSettings />} />
    <Route path="/site-settings" element={<AdminSiteSettings />} />
    <Route path="/page-content" element={<PageContentManager />} />
    <Route path="/notifications" element={<AdminNotifications />} />
    <Route path="/invitations" element={<InvitationAnalytics />} />
    <Route path="/crypto-demo" element={<AdminCryptoDemo />} />
    <Route path="/saas" element={<AdminSaasManagement />} />
    <Route path="/saas/content/:tenantId" element={<TenantContentManager />} />
  </Routes>
);

const TenantAdminRoutes = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/tenant-admin/page-content" replace />} />
        <Route path="/page-content" element={<PageContentManager />} />
        <Route path="/site-settings" element={<AdminSiteSettings />} />
    </Routes>
);


function App() {
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Helmet>
            <title>SocialSphere - 现代化社交平台</title>
            <meta name="description" content="一个功能丰富的现代化社交应用，提供用户认证、动态分享、游戏中心和3D视觉效果" />
          </Helmet>
          <div className="min-h-screen flex flex-col bg-gray-50 md:bg-transparent">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/invite/:inviteCode" element={<InvitePage />} />
              <Route path="/confirm-email" element={<EmailConfirmation />} />
              
              <Route path="/admin/*" element={
                <AdminRoute>
                  <AdminLayout>
                    <SuperAdminRoutes />
                  </AdminLayout>
                </AdminRoute>
              } />

              <Route path="/tenant-admin/*" element={
                <TenantAdminRoute>
                    <TenantAdminLayout>
                        <TenantAdminRoutes />
                    </TenantAdminLayout>
                </TenantAdminRoute>
              } />

              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/social" element={<SocialFeed />} />
                <Route path="/prediction" element={<Prediction />} />
                <Route path="/games" element={<GameCenter />} />
                <Route path="/games/prediction-28" element={<PredictionGame />} />
                
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/points-center" element={<ProtectedRoute><PointsCenter /></ProtectedRoute>} />
                <Route path="/points-history" element={<ProtectedRoute><PointsHistory /></ProtectedRoute>} />
              </Route>
              
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
