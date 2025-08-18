
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const AdminRoute = ({ children }) => {
  const { profile, loading: authLoading, user } = useAuth();
  const [isSiteAdmin, setIsSiteAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const checkAdminStatus = async () => {
      if (!user) {
        setIsSiteAdmin(false);
        setLoading(false);
        return;
      }
      
      // Super admin check
      if (profile?.role === 'admin') {
        setIsSiteAdmin(true);
        setLoading(false);
        return;
      }

      // Tenant admin check
      const tenantId = import.meta.env.VITE_TENANT_ID;
      if (tenantId) {
        const { data, error } = await supabase
          .from('tenant_admins')
          .select('id')
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId)
          .single();
        
        setIsSiteAdmin(!!data);
      } else {
        // If not a tenant site, only super admin can access
        setIsSiteAdmin(false);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [authLoading, user, profile]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen admin-bg">
        <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!isSiteAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
