import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Gem, Gift, Users, Edit, Megaphone, History, Award, Recycle, Repeat, MessageSquare, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const REASON_MAP = {
  '发布动态': { text: '发布动态', icon: Edit, color: 'text-blue-500' },
  '发布广告': { text: '发布广告', icon: Megaphone, color: 'text-orange-500' },
  '邀请好友奖励': { text: '邀请好友奖励', icon: Gift, color: 'text-green-500' },
  '每日签到': { text: '每日签到', icon: Star, color: 'text-yellow-500' },
  '注册奖励': { text: '注册奖励', icon: Award, color: 'text-purple-500' },
  '管理员下发': { text: '管理员下发', icon: Award, color: 'text-purple-500' },
  '管理员收回': { text: '管理员收回', icon: Recycle, color: 'text-red-500' },
  '兑换虚拟分': { text: '兑换虚拟分', icon: Gem, color: 'text-cyan-500' },
  '虚拟分兑入': { text: '虚拟分兑入', icon: Repeat, color: 'text-indigo-500' },
  '发表评论': { text: '发表评论', icon: MessageSquare, color: 'text-teal-500' },
};

const PointsHistory = () => {
  const { user, profile, loading: authLoading, siteSettings } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching points history:", error);
      } else {
        setHistory(data);
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchHistory();
    }
  }, [user, authLoading]);

  const renderHistoryItem = (item) => {
    const reasonInfo = REASON_MAP[item.reason] || { text: item.reason, icon: Coins, color: 'text-gray-500' };
    const Icon = reasonInfo.icon;
    const isIncome = item.change_amount > 0;
    
    const displayAmount = Math.abs(item.change_amount);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full bg-gray-100 ${reasonInfo.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">{reasonInfo.text}</p>
            <p className="text-xs text-gray-500" title={format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss')}>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: zhCN })}
            </p>
          </div>
        </div>
        <div className={`text-lg font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{displayAmount}
        </div>
      </motion.div>
    );
  };
  
  const HistorySkeleton = () => (
     <div className="flex items-center justify-between p-3 bg-white rounded-lg">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
  )

  return (
    <>
      <Helmet>
        <title>{String('积分记录 - ' + (siteSettings?.site_name ?? '大海团队'))}</title>
        <meta name="description" content="查看您的积分收支明细" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="ghost">
              <Link to="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回个人资料
              </Link>
            </Button>
          </div>

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <History className="mr-3 text-purple-500"/>
                积分记录
              </CardTitle>
              <CardDescription>您的每一笔积分收支都会记录在这里。</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-center bg-purple-50 p-4 rounded-b-lg">
                 <div>
                    <p className="text-xs text-purple-800">当前总积分</p>
                    {authLoading ? <Skeleton className="h-8 w-24 mt-1 mx-auto" /> : <p className="text-2xl font-bold text-purple-600">{profile?.points ?? 0}</p>}
                 </div>
                 <div>
                    <p className="text-xs text-purple-800">邀请总收益</p>
                    {authLoading ? <Skeleton className="h-8 w-24 mt-1 mx-auto" /> : <p className="text-2xl font-bold text-purple-600">{profile?.invitation_points ?? 0}</p>}
                 </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            {loading ? (
              <>
                <HistorySkeleton />
                <HistorySkeleton />
                <HistorySkeleton />
              </>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                 <Coins className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="font-semibold">暂无积分记录</p>
                <p className="text-sm mt-1">快去发布动态或邀请好友赚取积分吧！</p>
              </div>
            ) : (
               history.map(renderHistoryItem)
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default PointsHistory;