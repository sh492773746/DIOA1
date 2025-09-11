import React from 'react';
import Dashboard from '@/pages/Dashboard';
import TenantDashboard from '@/pages/TenantDashboard';
import GameCenter from '@/pages/GameCenter';
import TenantGameCenter from '@/pages/TenantGameCenter';

const SiteRouter = ({ pageType }) => {
    // With Supabase disconnected, we default to the main site.
    const isTenant = false;

    if (pageType === 'dashboard') {
        return isTenant ? <TenantDashboard isPreview={false} /> : <Dashboard />;
    }

    if (pageType === 'game-center') {
        return isTenant ? <TenantGameCenter isPreview={false} /> : <GameCenter />;
    }
    
    return <div>Invalid page type</div>;
};

export default SiteRouter;