
import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import Root from '@/Root';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import TenantAdminRoute from '@/components/TenantAdminRoute';
import SiteRouter from '@/components/SiteRouter';

// Layouts
import MainLayout from '@/components/MainLayout';
import AdminLayout from '@/components/AdminLayout';
import TenantAdminLayout from '@/components/TenantAdminLayout';

// Main Pages
// These will be dynamically loaded by SiteRouter
// import Dashboard from '@/pages/Dashboard';
// import GameCenter from '@/pages/GameCenter';
import SocialFeed from '@/pages/SocialFeed';
import Prediction from '@/pages/Prediction';
import PredictionGame from '@/pages/PredictionGame';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import PointsCenter from '@/pages/PointsCenter';
import PointsHistory from '@/pages/PointsHistory';
import Notifications from '@/pages/Notifications';

// Auth Pages
import AuthPage from '@/pages/AuthPage';
import AuthCallback from '@/pages/AuthCallback';
import EmailConfirmation from '@/pages/EmailConfirmation';
import InvitePage from '@/pages/InvitePage';

// Admin Pages
import AdminDashboard from '@/pages/AdminDashboard';
import UserManagement from '@/pages/UserManagement';
import ContentModeration from '@/pages/ContentModeration';
import AdminSettings from '@/pages/AdminSettings';
import AdminSiteSettings from '@/pages/AdminSiteSettings';
import PageContentManager from '@/pages/PageContentManager';
import AdminNotifications from '@/pages/AdminNotifications';
import InvitationAnalytics from '@/pages/InvitationAnalytics';
import AdminCryptoDemo from '@/pages/AdminCryptoDemo';
import AdminSaasManagement from '@/pages/AdminSaasManagement';
import TenantContentManager from '@/pages/TenantContentManager';

// Tenant Admin Pages
import TenantDashboard from '@/pages/TenantDashboard';
import TenantPageContentManager from '@/pages/TenantPageContentManager';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'auth/callback',
        element: <AuthCallback />,
      },
      {
        path: 'invite/:inviteCode',
        element: <InvitePage />,
      },
      {
        path: 'confirm-email',
        element: <EmailConfirmation />,
      },
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <SiteRouter pageType="dashboard" />,
          },
          {
            path: 'social',
            element: <SocialFeed />,
          },
          {
            path: 'prediction',
            element: <Prediction />,
          },
          {
            path: 'games',
            element: <SiteRouter pageType="game-center" />,
          },
          {
            path: 'games/prediction-28',
            element: <PredictionGame />,
          },
          {
            path: 'notifications',
            element: <ProtectedRoute><Notifications /></ProtectedRoute>,
          },
          {
            path: 'profile',
            element: <ProtectedRoute><Profile /></ProtectedRoute>,
          },
          {
            path: 'profile/:userId',
            element: <Profile />,
          },
          {
            path: 'profile/edit',
            element: <ProtectedRoute><EditProfile /></ProtectedRoute>,
          },
          {
            path: 'points-center',
            element: <ProtectedRoute><PointsCenter /></ProtectedRoute>,
          },
          {
            path: 'points-history',
            element: <ProtectedRoute><PointsHistory /></ProtectedRoute>,
          },
        ],
      },
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'users', element: <UserManagement /> },
            { path: 'content', element: <ContentModeration /> },
            { path: 'app-settings', element: <AdminSettings /> },
            { path: 'site-settings', element: <AdminSiteSettings /> },
            { path: 'page-content', element: <PageContentManager /> },
            { path: 'notifications', element: <AdminNotifications /> },
            { path: 'invitations', element: <InvitationAnalytics /> },
            { path: 'crypto-demo', element: <AdminCryptoDemo /> },
            { path: 'saas', element: <AdminSaasManagement /> },
            { path: 'saas/content/:tenantId', element: <TenantContentManager /> },
        ]
      },
      {
        path: 'tenant-admin',
        element: <TenantAdminRoute><TenantAdminLayout /></TenantAdminRoute>,
        children: [
            { index: true, element: <TenantDashboard /> },
            { path: 'page-content', element: <TenantPageContentManager /> },
            { path: 'site-settings', element: <AdminSiteSettings /> },
        ]
      }
    ],
  },
]);

export default router;
