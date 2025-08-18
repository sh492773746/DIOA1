import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import Navigation from '@/components/Navigation';

const MainLayout = () => {
  const location = useLocation();

  const noNavRoutes = ['/auth'];
  const noTopNavRoutes = ['/games/prediction-28'];

  const showBottomNav = !noNavRoutes.includes(location.pathname);
  const showTopNav = !noTopNavRoutes.includes(location.pathname) && !noNavRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {showTopNav && <Navigation />}
      <main className={`flex-grow ${showBottomNav ? 'pb-16' : ''}`}>
        <Outlet />
      </main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default MainLayout;