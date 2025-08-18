
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, TrendingDown, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchWithRetry } from '@/lib/api';

const StatCard = ({ title, value, icon: Icon, loading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};

const PlausibleStats = () => {
  const [stats, setStats] = useState({
    visitors: 0,
    pageviews: 0,
    bounce_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const { toast } = useToast();
  
  const periodOptions = {
    'today': '今天',
    '7d': '过去 7 天',
    '30d': '过去 30 天',
  };

  const fetchStats = useCallback(async (currentPeriod) => {
    setLoading(true);
    setError(null);

    try {
        const { data, error: functionError } = await fetchWithRetry(() => supabase.functions.invoke('create-plausible-proxy', {
            body: { period: currentPeriod }
        }));

        if (functionError) {
            let errorMessage = "获取网站统计数据失败。请检查您的后台配置和网络连接。";
            if (functionError.message.includes("Plausible API key is not configured")) {
                errorMessage = "Plausible API 密钥未配置。请在 Supabase 后台设置 PLAUSIBLE_API_KEY。";
            } else if (functionError.message.includes("Unauthorized")) {
                errorMessage = "Plausible API 密钥无效或权限不足。请检查您的密钥。";
            }
            throw new Error(errorMessage);
        }
        
        if (data && Array.isArray(data)) {
          const aggregatedStats = data.reduce(
            (acc, day) => {
              acc.visitors += day.visitors;
              acc.pageviews += day.pageviews;
              return acc;
            },
            { visitors: 0, pageviews: 0 }
          );

          const totalVisitors = aggregatedStats.visitors;
          const bounceRateSum = data.reduce((acc, day) => acc + (day.bounce_rate * day.visitors), 0);
          const averageBounceRate = totalVisitors > 0 ? (bounceRateSum / totalVisitors) : 0;

          setStats({
            visitors: aggregatedStats.visitors,
            pageviews: aggregatedStats.pageviews,
            bounce_rate: Math.round(averageBounceRate),
          });
        } else {
          throw new Error("未能获取有效的统计数据。收到的数据格式不正确。");
        }
    } catch(err) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "获取统计失败",
          description: err.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  if (error) {
    return (
      <div className="my-8 flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        <AlertCircle className="h-6 w-6 mr-3" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">网站统计</h2>
         <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(periodOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          title="独立访客" 
          value={stats.visitors.toLocaleString()} 
          icon={Users} 
          loading={loading}
        />
        <StatCard 
          title="总浏览量" 
          value={stats.pageviews.toLocaleString()} 
          icon={Eye} 
          loading={loading}
        />
        <StatCard 
          title="平均跳出率" 
          value={`${stats.bounce_rate}%`} 
          icon={TrendingDown} 
          loading={loading}
        />
      </div>
       <div style={{ fontSize: '14px', paddingTop: '14px', textAlign: 'center' }}>
        Stats powered by <a target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', textDecoration: 'underline' }} href="https://plausible.io">Plausible Analytics</a>
      </div>
    </div>
  );
};

export default PlausibleStats;
