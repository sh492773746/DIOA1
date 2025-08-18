
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchWithRetry } from '@/lib/api';

const AuthContext = createContext(undefined);

const fetchProfile = async (userId) => {
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
  const [loading, setLoading] = useState(true);
  
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await fetchWithRetry(() => fetchProfile(user.id));
      if (error) throw error; 

      if(data){
        setProfile(data);
      } else {
          toast({
              variant: "destructive",
              title: "获取个人资料失败",
              description: "无法加载您的用户数据，请稍后重试。",
          });
      }
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
  }, [user, toast]);
  
  const signOut = useCallback(async (options = {}) => {
    const { scope } = options;
    const { error } = await supabase.auth.signOut({ scope });
    
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
            localStorage.removeItem(key);
        }
    });

    setSession(null);
    setUser(null);
    setProfile(null);
    
    if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
      toast({
        variant: "destructive",
        title: "登出失败",
        description: error.message || "出错了",
      });
    }

    return { error };
  }, [toast]);


  const handleSession = useCallback(async (currentSession) => {
    setLoading(true);
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
        try {
            const {data: profileData, error} = await fetchWithRetry(() => fetchProfile(currentUser.id));
            if(error) {
                if(error.code === "PGRST116"){ 
                     setTimeout(async () => {
                         const {data: retryData} = await fetchProfile(currentUser.id);
                         if(retryData) setProfile(retryData);
                     }, 1500);
                } else {
                    throw error;
                }
            }

            if (profileData) {
                setProfile(profileData);
            }
        } catch (error) {
            console.error('Error fetching profile after retries:', error.message);
            toast({
                variant: "destructive",
                title: "获取个人资料失败",
                description: "多次尝试后仍无法加载您的用户数据，请检查网络连接。",
            });
            setProfile(null);
            await signOut({ scope: 'local' });
            navigate('/auth');
        }
    } else {
        setProfile(null);
    }
    setLoading(false);
  }, [toast, navigate, signOut]);


  useEffect(() => {
    const getSessionAndHandle = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if(error){
          console.error("Error getting session:", error);
          setLoading(false);
          return;
      }
      await handleSession(session);
    };

    getSessionAndHandle();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
            setLoading(true);
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            navigate('/auth');
        } else if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('Token refresh failed. The refresh token might be invalid. Forcing sign-out.');
            toast({
              title: "会话已过期",
              description: "您的登录凭证已失效，请重新登录。",
              variant: "destructive"
            });
            await signOut({ scope: 'local' });
            navigate('/auth', { replace: true });
        } else {
            await handleSession(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleSession, toast, navigate, signOut]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "注册失败",
        description: error.message || "出错了",
      });
    }
    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error.message || "出错了",
      });
    }

    return { data, error };
  }, [toast]);
  
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { data: null, error: new Error("User not authenticated") };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      setProfile(data);
    }
    return { data, error };
  }, [user]);

  const dailyCheckIn = useCallback(async () => {
    const { data, error } = await supabase.rpc('handle_daily_check_in');
    if (error) {
      toast({ variant: 'destructive', title: '操作失败', description: error.message });
      return null;
    }
    if (data.success) {
      toast({ title: '签到成功!', description: `恭喜您获得 ${data.reward} 积分！` });
      refreshProfile();
    } else {
      toast({ title: '提示', description: data.message });
    }
    return data;
  }, [toast, refreshProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    dailyCheckIn,
  }), [user, profile, session, loading, signUp, signIn, signOut, updateProfile, refreshProfile, dailyCheckIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
