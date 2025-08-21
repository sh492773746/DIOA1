
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Loader2 } from 'lucide-react';

const AdminRoute = () => {
  const { isSuperAdmin, loading, appTenantId } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!isSuperAdmin || appTenantId) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute;
