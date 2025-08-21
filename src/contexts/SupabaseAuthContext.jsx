import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchWithRetry } from '@/lib/api';

const AuthContext = createContext(undefined);

const fetchProfile = async (userId) => {
    if (!userId) return { data: null, error: null, status: 400 };
    const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    return { data, error, status };
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [appTenantId, setAppTenantId] = useState(null);
  const [tenantIdIsLoading, setTenantIdIsLoading] = useState(true);
  const [sessionIsLoading, setSessionIsLoading] = useState(true);

  useEffect(() => {
    const determineTenantId = async () => {
      setTenantIdIsLoading(true);
      const hostname = window.location.hostname;
      
      // 主站或本地开发环境
      if (hostname === 'localhost' || hostname.includes('app-preview.com') || hostname === '127.0.0.1' || hostname === 'main-domain.com') {
        setAppTenantId(null);
      } else {
          try {
            const { data, error } = await supabase.rpc('get_tenant_id_by_hostname', { p_hostname: hostname });
            if (error) {
              console.error("Error fetching tenant ID by hostname:", error);
              setAppTenantId(null);
            } else {
              setAppTenantId(data);
            }
          } catch (e) {
            console.error("Exception fetching tenant ID:", e);
            setAppTenantId(null);
          }
      }
      setTenantIdIsLoading(false);
    };
    determineTenantId();
  }, []);

  const signOut = useCallback(async (options = {}) => {
    const { scope, redirect = true, message } = options;
    await supabase.auth.signOut({ scope });
    
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
            localStorage.removeItem(key);
        }
    });
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsSuperAdmin(false);
    setIsTenantAdmin(false);
    
    if (message) {
        toast({
            title: "会话已过期",
            description: message,
        });
    }

    if (redirect) {
        navigate('/auth', { replace: true });
    }
  }, [toast, navigate]);

  const checkAdminRoles = useCallback(async (currentProfile) => {
    if (!currentProfile) {
      setIsSuperAdmin(false);
      setIsTenantAdmin(false);
      return;
    }
    
    const superAdmin = currentProfile.role === 'admin';
    setIsSuperAdmin(superAdmin);
    
    const { data: isAnyTenantAdmin, error } = await supabase.rpc('is_any_tenant_admin', { p_user_id: currentProfile.id });
    if (error) {
        console.error("Error checking tenant admin status:", error);
        setIsTenantAdmin(false);
    } else {
        setIsTenantAdmin(isAnyTenantAdmin);
    }

  }, [supabase]);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
        try {
            const {data: profileData} = await fetchWithRetry(() => fetchProfile(currentUser.id));
            setProfile(profileData || null);
            await checkAdminRoles(profileData || null);
        } catch (error) {
            console.error('Error fetching profile after retries:', error.message);
            toast({
                variant: "destructive",
                title: "获取个人资料失败",
                description: "多次尝试后仍无法加载您的用户数据，请检查网络连接。",
            });
            setProfile(null);
            await checkAdminRoles(null);
        }
    } else {
        setProfile(null);
        await checkAdminRoles(null);
    }
  }, [toast, checkAdminRoles]);

  useEffect(() => {
    setSessionIsLoading(true);
    const getSessionAndHandle = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      await handleSession(initialSession);
      setSessionIsLoading(false);
    };

    getSessionAndHandle();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSessionIsLoading(true);
        await handleSession(newSession);
        setSessionIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleSession]);
  
  useEffect(() => {
    if (!tenantIdIsLoading && !sessionIsLoading) {
      setIsInitialized(true);
    }
  }, [tenantIdIsLoading, sessionIsLoading]);


  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await fetchWithRetry(() => fetchProfile(user.id));
      setProfile(data || null);
      await checkAdminRoles(data || null);
      return data;
    } catch (error) {
      console.error('Error refreshing profile after retries:', error.message);
      toast({
          variant: "destructive",
          title: "获取个人资料失败",
          description: "多次尝试后仍无法加载您的用户数据，请检查网络连接。",
      });
      return null;
    }
  }, [user, toast, checkAdminRoles]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    if (error) {
      toast({ variant: "destructive", title: "注册失败", description: error.message });
    }
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "登录失败", description: error.message });
    }
    return { data, error };
  }, [toast]);
  
  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading: !isInitialized,
    isInitialized,
    isSuperAdmin,
    isTenantAdmin,
    appTenantId,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [user, profile, session, isInitialized, isSuperAdmin, isTenantAdmin, appTenantId, signUp, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};