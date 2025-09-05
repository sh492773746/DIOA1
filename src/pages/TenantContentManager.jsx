import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const TenantContentManager = () => {
    const { tenantId } = useAuth();
    // This component is now deprecated and redirects to the unified PageContentManager.
    // Super admins will be redirected to the main site manager, 
    // while tenant admins will be redirected to their specific content manager.
    return <Navigate to={`/admin/content/${tenantId}`} replace />;
};

export default TenantContentManager;