
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithRetry } from '@/lib/api';

const AuthContext = createContext(undefined);

const fetchProfile = async (userId) => {
    if (!userId || !supabase) return { data: null, error: null, status: 400 };
    const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    return { data, error, status };
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tenantIdLoaded, setTenantIdLoaded] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [appTenantId, setAppTenantId] = useState(null);
  const [siteSettings, setSiteSettings] = useState({ site_name: '大海团队官网', site_logo_url: '', admin_theme: 'default', frontend_theme: 'default' });
  
  const forceSignOut = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsSuperAdmin(false);
    setIsTenantAdmin(false);
  }, []);

  const handleSession = useCallback(async (currentSession) => {
      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
          try {
              const { data: profileData, error: profileError } = await fetchWithRetry(() => fetchProfile(currentUser.id));
              if (profileError) {
                  if (profileError?.code === 'PGRST301' || profileError?.message?.includes('JWT') || profileError?.message?.includes('Session not found')) {
                       console.warn('Session is invalid, signing out.');
                       await supabase.auth.signOut();
                       forceSignOut();
                       return;
                  }
                  throw profileError;
              }
              setProfile(profileData || null);
              await checkAdminRoles(profileData || null);
          } catch (error) {
              console.error('Error handling session or fetching profile:', error.message);
              setProfile(null);
              await checkAdminRoles(null);
          }
      } else {
          forceSignOut();
      }
  }, [forceSignOut]);

  useEffect(() => {
    const initializeApp = async () => {
      if (!supabase) {
        console.error("Supabase client is not initialized. Check your environment variables.");
        setIsInitialized(true);
        setTenantIdLoaded(true);
        return;
      }

      const hostname = window.location.hostname;
      const mainDomain = import.meta.env.VITE_MAIN_DOMAIN || 'main-domain.com';
      let currentTenantId = null;

      if (hostname !== 'localhost' && !hostname.includes('app-preview.com') && hostname !== '127.0.0.1' && hostname !== mainDomain) {
          try {
            const { data, error } = await supabase.rpc('get_tenant_id_by_hostname', { p_hostname: hostname });
            if (error) {
              console.error("Error fetching tenant ID by hostname:", error);
            } else {
              currentTenantId = data;
            }
          } catch (e) {
            console.error("Exception fetching tenant ID:", e);
          }
      }
      
      // If it's main domain, tenantId is 0.
      setAppTenantId(currentTenantId ?? 0);
      setTenantIdLoaded(true);
      
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      try {
        const settingsTenantId = currentTenantId ?? 0;
        const { data: settingsData, error: settingsError } = await fetchWithRetry(() => 
            supabase.rpc('get_tenant_settings_with_fallback', { p_tenant_id: settingsTenantId })
        );

        if (settingsError) {
            throw settingsError;
        }

        const settingsMap = (settingsData || []).reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
        
        setSiteSettings(settingsMap);

      } catch (error) {
          console.error("Error fetching site settings:", error);
          setSiteSettings({ site_name: '加载失败', site_logo_url: '', admin_theme: 'default', frontend_theme: 'default' });
      }
      
      await handleSession(initialSession);
      setIsInitialized(true);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (event === 'TOKEN_REFRESHED' && (newSession === null || newSession?.user === null)) {
            console.warn('Token refresh failed, forcing sign out.');
            await supabase.auth.signOut();
            forceSignOut();
          } else {
            await handleSession(newSession);
          }
        }
      );
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initializeApp();
  }, [handleSession, forceSignOut]);

  const checkAdminRoles = useCallback(async (currentProfile) => {
    if (!currentProfile || !supabase) {
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

  const refreshProfile = useCallback(async () => {
    if (!user || !supabase) return;
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
    if (!supabase) return { data: null, error: { message: "Supabase not initialized" } };
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) toast({ variant: "destructive", title: "注册失败", description: error.message });
    return { data, error };
  }, [toast, supabase]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { data: null, error: { message: "Supabase not initialized" } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ variant: "destructive", title: "登录失败", description: error.message });
    return { data, error };
  }, [toast, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out, possibly due to invalid session. Forcing state cleanup.", error);
    } finally {
      forceSignOut();
    }
  }, [forceSignOut, supabase]);
  
  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading: !isInitialized,
    isInitialized,
    tenantIdLoaded,
    isSuperAdmin,
    isTenantAdmin,
    appTenantId,
    siteSettings,
    supabaseClient: supabase,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [user, profile, session, isInitialized, tenantIdLoaded, isSuperAdmin, isTenantAdmin, appTenantId, siteSettings, signUp, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
