import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, Brush } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import TenantInfo from '@/components/TenantInfo';
import InteractiveCarousel from '@/components/InteractiveCarousel';


const TenantDashboard = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const tenantId = profile?.tenant_id;

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

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
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
                                <Button className="w-full justify-between" size="lg" variant="outline" onClick={() => navigate('/tenant-admin/site-settings')}>
                                    <span>编辑站点设置</span>
                                    <Brush className="h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                       <TenantInfo tenantId={tenantId} />
                    </motion.div>
                    <motion.div 
                        className="lg:col-span-3"
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>首页轮播图预览</CardTitle>
                                <CardDescription>这是您分站首页当前展示的轮播图效果。</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InteractiveCarousel />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default TenantDashboard;