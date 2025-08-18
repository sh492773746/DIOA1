import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, LogOut, Settings, Award, Users, Star, Gift, Globe, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import UserActivity from '@/components/UserActivity';
import NeonAd from '@/components/NeonAd';
import { cn } from '@/lib/utils';
import { fetchWithRetry } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import TenantRequestForm from '@/pages/TenantRequestForm';

const StatCard = ({ icon, label, value, colorClass }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }}
    className="relative bg-white border border-gray-200/80 rounded-lg overflow-hidden shadow-sm transition-all"
  >
    <div className={cn("absolute top-0 left-0 right-0 h-1", colorClass)}></div>
    <div className="p-5">
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-gray-500">
           {icon}
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </motion.div>
);

const PgLiveStreamAd = () => {
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAd = async () => {
            setLoading(true);
            const { data, error } = await fetchWithRetry(() => supabase
                .from('page_content')
                .select('content')
                .eq('page', 'my_page')
                .eq('section', 'pg_live_stream')
                .eq('is_active', true)
                .order('position', { ascending: true })
                .limit(1)
                .single()
            );

            if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' error
                console.error('Error fetching PG ad:', error);
            } else {
                setAd(data?.content);
            }
            setLoading(false);
        };
        fetchAd();
    }, []);

    if (loading) {
        return <Skeleton className="h-[120px] w-full rounded-lg mb-8" />;
    }

    if (!ad) {
        return null;
    }

    return (
        <div className="mb-8">
            <NeonAd
                title={ad.title}
                description={ad.description}
                link={ad.link_url}
                imageUrl={ad.image_url}
            />
        </div>
    );
};


const Profile = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tenantRequest, setTenantRequest] = useState(null);
  const [isRequestLoading, setIsRequestLoading] = useState(true);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  useEffect(() => {
    const checkTenantAdminStatus = async () => {
      if (!user) return;
      const { data, error } = await supabase.rpc('is_any_tenant_admin', { p_user_id: user.id });
      if (!error && data) {
        setIsTenantAdmin(data);
      }
    };
    checkTenantAdminStatus();
  }, [user]);

  const fetchTenantRequest = useCallback(async () => {
    if (!user) return;
    setIsRequestLoading(true);
    const { data, error } = await supabase
      .from('tenant_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      toast({ variant: 'destructive', title: '获取分站申请状态失败', description: error.message });
      setTenantRequest(null);
    } else {
      setTenantRequest(data?.[0] || null);
    }
    setIsRequestLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTenantRequest();
  }, [fetchTenantRequest]);

  const handleRequestSuccess = () => {
    setIsRequestFormOpen(false);
    fetchTenantRequest();
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-[120px] w-full rounded-lg mb-8" />
        <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-grow space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "退出登录失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "已成功退出登录",
      });
      navigate('/', { replace: true });
    }
  };
  
  const canMakeNewRequest = !tenantRequest || tenantRequest.status === 'rejected';

  const renderTenantInfo = () => {
      if(isRequestLoading) {
          return <Skeleton className="h-10 w-full rounded-md" />
      }

      if(!tenantRequest) return null;

      if(tenantRequest.status === 'approved') {
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 flex items-center mb-2"><CheckCircle className="h-5 w-5 mr-2" />您的分站已激活</h3>
                <div className="space-y-2 text-sm">
                    <p>
                        <strong>自定义域名: </strong>
                        <a href={`https://${tenantRequest.desired_domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            {tenantRequest.desired_domain} <ExternalLink className="h-3 w-3" />
                        </a>
                    </p>
                    <p>
                        <strong>Vercel 域名: </strong>
                        <a href={`https://${tenantRequest.vercel_assigned_domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            {tenantRequest.vercel_assigned_domain} <ExternalLink className="h-3 w-3" />
                        </a>
                    </p>
                </div>
            </motion.div>
          );
      }
      
      if(tenantRequest.status === 'pending') {
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 flex items-center mb-1"><Clock className="h-5 w-5 mr-2" />您的分站正在审核中</h3>
                <p className="text-sm text-yellow-700">请耐心等待管理员批准您的申请。</p>
            </motion.div>
          );
      }
      
      return null;
  }

  return (
    <>
      <Helmet>
        <title>{`${profile.username}的个人主页`}</title>
        <meta name="description" content={`查看${profile.username}的个人资料和统计数据。`} />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PgLiveStreamAd />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg mb-8"
        >
          <div className="flex flex-col items-center md:flex-row md:items-start gap-8">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Avatar className="w-32 h-32 border-4 border-purple-300 shadow-md">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="text-4xl">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800">{profile.username}</h1>
              <p className="text-gray-500 mt-1">UID: {profile.uid}</p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <Button onClick={() => navigate('/profile/edit')}>
                  <Edit className="mr-2 h-4 w-4" /> 编辑资料
                </Button>
                <Button variant="outline" onClick={() => navigate('/points-history')}>
                  <Award className="mr-2 h-4 w-4" /> 积分历史
                </Button>
                <Button variant="outline" onClick={() => navigate('/points-center')}>
                  <Gift className="mr-2 h-4 w-4" /> 积分中心
                </Button>
                
                {canMakeNewRequest && (
                    <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Globe className="mr-2 h-4 w-4" /> 申请分站
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>申请创建您的专属分站</DialogTitle>
                            <DialogDescription>
                              填写下面的表单来申请一个由我们为您托管和维护的独立站点。
                            </DialogDescription>
                          </DialogHeader>
                          <TenantRequestForm onSuccess={handleRequestSuccess} />
                        </DialogContent>
                    </Dialog>
                )}

                 {(profile.role === 'admin' || isTenantAdmin) && (
                  <Button variant="secondary" onClick={() => navigate('/admin')}>
                    <Settings className="mr-2 h-4 w-4" /> 管理后台
                  </Button>
                )}
              </div>
              {renderTenantInfo()}
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="text-red-500 self-start mt-2 md:mt-0">
              <LogOut className="mr-2 h-4 w-4" /> 退出
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard icon={<Award className="w-5 h-5" />} label="可用积分" value={profile.points || 0} colorClass="bg-blue-500" />
          <StatCard icon={<Star className="w-5 h-5" />} label="虚拟分" value={profile.virtual_currency || 0} colorClass="bg-purple-500" />
          <StatCard icon={<Users className="w-5 h-5" />} label="邀请好友" value={profile.invited_users_count || 0} colorClass="bg-green-500" />
          <StatCard icon={<Gift className="w-5 h-5" />} label="邀请总奖励" value={profile.invitation_points || 0} colorClass="bg-pink-500" />
        </motion.div>
        
        <div className="mt-8">
          <UserActivity userId={user.id} />
        </div>
        
      </div>
    </>
  );
};

export default Profile;
