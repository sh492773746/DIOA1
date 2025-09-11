import React from 'react';
import { Navigate } from 'react-router-dom';

const TenantPageContentManager = () => {
    // This component is now deprecated and redirects to the unified PageContentManager.
    return <Navigate to="/admin/content" replace />;
};

export default TenantPageContentManager;