
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';

const SiteHelmet = () => {
    const { siteSettings } = useAuth();
    return (
        <Helmet>
            <title>{siteSettings.site_name}</title>
            <meta name="description" content={`欢迎来到${siteSettings.site_name} - 一个功能丰富的现代化社交应用，提供用户认证、动态分享、游戏中心和3D视觉效果`} />
            <meta property="og:title" content={siteSettings.site_name} />
            <meta property="og:description" content={`欢迎来到${siteSettings.site_name} - 一个功能丰富的现代化社交应用，提供用户认证、动态分享、游戏中心和3D视觉效果`} />
        </Helmet>
    );
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SiteHelmet />
        <div className="min-h-screen flex flex-col bg-gray-50 md:bg-transparent">
          <Outlet />
          <Toaster />
        </div>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
