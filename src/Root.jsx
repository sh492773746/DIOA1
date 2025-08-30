import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Loader2, AlertTriangle } from 'lucide-react';

const AppContent = () => {
  const { isInitialized, supabaseClient, siteSettings } = useAuth();
  const [theme, setTheme] = useState('default');

  useEffect(() => {
    // Prioritize frontend_theme for the main app, fallback to admin_theme if frontend_theme is not set
    // or if it's an admin page (which might use admin_theme for its specific background)
    if (siteSettings?.frontend_theme) {
      setTheme(siteSettings.frontend_theme);
    } else if (siteSettings?.admin_theme) {
      setTheme(siteSettings.admin_theme);
    }
  }, [siteSettings]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-gray-700">正在加载应用...</p>
        </div>
      </div>
    );
  }

  if (!supabaseClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800">
        <div className="text-center p-8 border-2 border-dashed border-red-300 rounded-lg">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">应用配置错误</h1>
          <p className="mt-2 max-w-md">无法连接至后端服务。请检查您的网络连接或联系技术支持以获取帮助。</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{siteSettings?.site_name || '大海团队官网'}</title>
        <meta name="description" content="一个由大海团队创建的应用。" />
        {siteSettings?.site_logo_url && <link rel="icon" href={siteSettings.site_logo_url} />}
      </Helmet>
      <Outlet />
    </>
  );
};

const Root = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </HelmetProvider>
  );
};

export default Root;