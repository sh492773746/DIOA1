
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const TenantAdminRoute = ({ children }) => {
  const { loading, isTenantAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen admin-bg">
        <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
      </div>
    );
  }

  // Allow super admins to access tenant admin routes
  if (isSuperAdmin) {
    return children;
  }
  
  // If user is not a tenant admin, redirect them to the main app
  if (!isTenantAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default TenantAdminRoute;