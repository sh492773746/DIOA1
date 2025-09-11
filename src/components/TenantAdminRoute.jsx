import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const TenantAdminRoute = ({ children }) => {
  const { loading, isTenantAdmin, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isTenantAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default TenantAdminRoute;