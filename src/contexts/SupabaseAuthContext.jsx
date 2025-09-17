
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase as supabaseClient } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { fetchWithRetry } from '@/lib/api';

const AuthContext = createContext(undefined);

const fetchSiteSettings = async () => {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Error fetching settings via BFF:', e);
    throw e;
  }
};

const fetchProfile = async (userId) => {
    if (!userId) return null;
    const { data, error } = await fetchWithRetry(() => supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single());

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
        console.error("Error fetching profile:", error);
        throw error;
    }
    return data;
}

const checkSuperAdmin = async (userId) => {
    if (!userId) return false;
    const { data, error } = await fetchWithRetry(() => supabaseClient.rpc('is_admin', { p_user_id: userId }));
    if (error) {
        console.error("Error checking super admin status:", error);
        return false;
    }
    return data;
};

const fetchTenantAdmins = async (userId) => {
    if (!userId) return [];
    const { data } = await fetchWithRetry(() => supabaseClient
        .from('tenant_admins')
        .select('tenant_id')
        .eq('user_id', userId));
    return data || [];
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeTenantId: tenantId, isLoading: isTenantLoading } = useTenant();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [siteSettings, setSiteSettings] = useState({});
  const [areSettingsLoading, setAreSettingsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  const { data: profile, isLoading: isProfileLoading } = useQuery({
      queryKey: ['profile', user?.id],
      queryFn: () => fetchProfile(user?.id),
      enabled: sessionLoaded && !!user,
  });

  const { data: isSuperAdmin, isLoading: isSuperAdminLoading } = useQuery({
      queryKey: ['isSuperAdmin', user?.id],
      queryFn: () => checkSuperAdmin(user?.id),
      enabled: sessionLoaded && !!user,
  });
  
  const { data: tenantAdminData, isLoading: isTenantAdminLoading } = useQuery({
      queryKey: ['tenantAdmin', user?.id],
      queryFn: () => fetchTenantAdmins(user?.id),
      enabled: sessionLoaded && !!user,
  });

  const isTenantAdmin = tenantAdminData && tenantAdminData.length > 0;
  
  const userTenantId = useMemo(() => {
    if (isTenantAdmin) return tenantAdminData[0]?.tenant_id;
    return profile?.tenant_id;
  }, [profile, isTenantAdmin, tenantAdminData]);


  useEffect(() => {
    const loadSettings = async () => {
      if (tenantId !== undefined && tenantId !== null) {
        setAreSettingsLoading(true);
        try {
          const settings = await fetchSiteSettings(tenantId);
          setSiteSettings(settings);
        } catch (e) {
          if (e.message.includes('Failed to fetch')) {
            setConnectionError("无法连接到数据库。请检查您的网络设置或完成Supabase集成。");
          }
        } finally {
          setAreSettingsLoading(false);
        }
      }
    };
    if (!isTenantLoading) {
      loadSettings();
    }
  }, [tenantId, isTenantLoading]);

  const signOut = useCallback(async () => {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            if (!error.message.includes('session_not_found') && !error.message.includes('Socket closed')) {
               console.error("Caught unexpected exception during sign out:", error);
               throw error;
            }
        }
        toast({ title: "登出成功", description: "您已安全退出，期待您的下次访问。" });
    } catch (e) {
        console.error("Error during sign out process:", e);
        if (!e.message.includes('Failed to fetch')) {
          toast({
              variant: "destructive",
              title: "登出时发生错误",
              description: e.message
          });
        }
    } finally {
        queryClient.clear();
        setUser(null);
        setSession(null);
    }
  }, [toast, queryClient]);
  
  const handleSessionChange = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      queryClient.setQueryData(['profile', undefined], null);
      queryClient.setQueryData(['isSuperAdmin', undefined], false);
      queryClient.setQueryData(['tenantAdmin', undefined], []);
    }
    
    if(!sessionLoaded) setSessionLoaded(true);
  }, [queryClient, sessionLoaded]);

  useEffect(() => {
    let isMounted = true;
    if (!supabaseClient) {
      setConnectionError("Supabase 未能正确初始化。请检查您的 .env 文件并确保 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 已正确设置。");
      setSessionLoaded(true);
      return;
    }

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if(isMounted) {
          handleSessionChange(session);
        }
      }
    );
    
    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        if (!isMounted) return;

        if (error) {
            console.error("Error getting session:", error);
            if (error.message.includes('Failed to fetch')) {
                setConnectionError("无法连接到数据库。请检查您的网络设置或完成Supabase集成。");
            }
            handleSessionChange(null);
        } else {
            handleSessionChange(session);
        }
    }).catch(err => {
        console.error("Critical error in getSession promise:", err);
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            setConnectionError("无法连接到数据库。请检查您的网络设置或完成Supabase集成。");
        }
        if (isMounted) {
          handleSessionChange(null);
        }
    }).finally(() => {
      if (isMounted && !sessionLoaded) {
        setSessionLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [handleSessionChange, sessionLoaded, signOut]);

  const isAdmin = !!isSuperAdmin || isTenantAdmin;

  const isInitialized = useMemo(() => {
    if (isTenantLoading || !sessionLoaded || areSettingsLoading) return false;
    if (user) {
        return !isProfileLoading && !isSuperAdminLoading && !isTenantAdminLoading;
    }
    return true;
  }, [isTenantLoading, sessionLoaded, user, isProfileLoading, isSuperAdminLoading, isTenantAdminLoading, areSettingsLoading]);

  const loading = !isInitialized;
  
  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await fetchWithRetry(() => supabaseClient.auth.signUp({ email, password, options: { ...options, data: { hostname: window.location.hostname } }}));
    if (error) {
      toast({ variant: "destructive", title: "注册失败", description: error.message || "发生未知错误" });
    } else if (data.user) {
      toast({ title: "注册成功", description: "请检查您的邮箱以完成验证。" });
    }
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await fetchWithRetry(() => supabaseClient.auth.signInWithPassword({ email, password }));
    if (error) {
      toast({ variant: "destructive", title: "登录失败", description: error.message || "发生未知错误" });
    } else if (data.user) {
      toast({ title: "登录成功", description: `欢迎回来, ${data.user.email}!` });
    }
    return { data, error };
}, [toast]);

  const refreshProfile = useCallback(() => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
  }, [user, queryClient]);

  const refreshSiteSettings = useCallback(() => {
    if (tenantId !== undefined) {
      setAreSettingsLoading(true);
      fetchSiteSettings(tenantId).then(settings => {
        setSiteSettings(settings);
        setAreSettingsLoading(false);
      });
    }
  }, [tenantId]);

  const value = {
    user,
    session,
    profile,
    siteSettings: siteSettings || {},
    loading,
    isInitialized,
    isAdmin,
    isSuperAdmin: !!isSuperAdmin,
    isTenantAdmin,
    tenantId, 
    userTenantId,
    connectionError,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    refreshSiteSettings,
    supabase: supabaseClient
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
