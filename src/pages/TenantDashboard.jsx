import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Link as LinkIcon, Loader2, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, subDays, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ title, value, icon, isLoading }) => (
    <Card className="shadow-lg border-l-4 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            {React.createElement(icon, { className: "h-5 w-5 text-gray-400" })}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
                <div className="text-3xl font-bold text-gray-800">{value}</div>
            )}
        </CardContent>
    </Card>
);

const TenantDashboard = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalUsers: 0, totalInvites: 0, todayNewUsers: 0 });
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const tenantId = profile?.tenant_id;

    useEffect(() => {
        const fetchStats = async () => {
            if (!tenantId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch total users and today's new users
                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select('created_at', { count: 'exact' })
                    .eq('tenant_id', tenantId);

                if (usersError) throw usersError;

                const today = startOfDay(new Date()).toISOString();
                const todayNewUsers = usersData.filter(u => u.created_at >= today).length;

                // Fetch total invites
                const { data: invitesData, error: invitesError } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact' })
                    .eq('tenant_id', tenantId)
                    .not('invited_by', 'is', null);

                if (invitesError) throw invitesError;
                
                setStats({
                    totalUsers: usersData.length,
                    totalInvites: invitesData.length,
                    todayNewUsers: todayNewUsers,
                });

                // Prepare chart data
                const labels = [];
                const dailyData = {};
                for (let i = 6; i >= 0; i--) {
                    const date = format(subDays(new Date(), i), 'MM-dd');
                    labels.push(date);
                    dailyData[date] = 0;
                }

                usersData.forEach(user => {
                    const date = format(new Date(user.created_at), 'MM-dd');
                    if (dailyData[date] !== undefined) {
                        dailyData[date]++;
                    }
                });

                setChartData({
                    labels,
                    datasets: [{
                        label: '新增用户',
                        data: Object.values(dailyData),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        fill: true,
                        tension: 0.4,
                    }]
                });

            } catch (error) {
                toast({ title: '获取统计数据失败', description: error.message, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        if(profile) {
            fetchStats();
        }
    }, [tenantId, toast, profile]);

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false } }
        }
    };

    return (
        <>
            <Helmet>
                <title>分站仪表盘 - 管理后台</title>
            </Helmet>
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold text-gray-900">分站仪表盘</h1>
                    <p className="mt-1 text-gray-500">欢迎回来, {profile?.username}! 这是您的分站运营中心。</p>
                </motion.div>

                <motion.div 
                    className="grid gap-6 md:grid-cols-3"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.1 }
                        }
                    }}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                        <StatCard title="总用户数" value={stats.totalUsers} icon={Users} isLoading={loading} />
                    </motion.div>
                    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                        <StatCard title="今日新增" value={stats.todayNewUsers} icon={UserPlus} isLoading={loading} />
                    </motion.div>
                    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                        <StatCard title="总邀请数" value={stats.totalInvites} icon={LinkIcon} isLoading={loading} />
                    </motion.div>
                </motion.div>
                
                <div className="grid gap-8 md:grid-cols-2">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="shadow-lg h-full">
                            <CardHeader>
                                <CardTitle>近期用户增长</CardTitle>
                                <CardDescription>过去7天每日新增用户数</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                ) : chartData && (
                                    <div className="h-64"><Line options={chartOptions} data={chartData} /></div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="shadow-lg h-full">
                            <CardHeader>
                                <CardTitle>快捷操作</CardTitle>
                                <CardDescription>快速访问常用功能</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button className="w-full justify-between" size="lg" onClick={() => navigate('/tenant-admin/page-content')}>
                                    <span>管理页面内容</span>
                                    <LayoutTemplate className="h-5 w-5" />
                                </Button>
                                <Button className="w-full justify-between" size="lg" variant="outline" onClick={() => navigate('/tenant-admin/invitations')}>
                                    <span>查看邀请统计</span>
                                    <LinkIcon className="h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default TenantDashboard;