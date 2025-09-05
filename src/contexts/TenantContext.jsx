
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getTenantIdByHostname } from '@/lib/utils';

const TenantContext = createContext({
  activeTenantId: 0,
  isLoading: true,
});

export const TenantProvider = ({ children }) => {
  const [activeTenantId, setActiveTenantId] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const identifyTenant = async () => {
      setIsLoading(true);
      const host = window.location.hostname;
      // This function is now the single source of truth for identifying the tenant from the client-side.
      // It should purely rely on the hostname.
      const idFromHost = await getTenantIdByHostname(host);
      setActiveTenantId(idFromHost);
      setIsLoading(false);
    };

    identifyTenant();
    // This effect should only run once when the app loads, as the hostname doesn't change during a session.
  }, []); 
  
  const value = useMemo(() => ({
      activeTenantId,
      isLoading,
  }), [activeTenantId, isLoading]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
