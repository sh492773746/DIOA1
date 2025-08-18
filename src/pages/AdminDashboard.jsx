import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, FileText, Settings, ArrowRight, LayoutTemplate } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import PlausibleStats from '@/components/PlausibleStats';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleFeatureClick = (path, featureName) => {
    if (path) {
      navigate(path);
    } else {
      toast({
        title: `🚧 ${featureName}功能开发中`,
        description: "此功能尚未实现，敬请期待！🚀"
      });
    }
  };

  const adminFeatures = [
    { title: '用户管理', description: '查看、编辑和管理所有用户。', icon: Users, path: '/admin/users', feature: '用户管理' },
    { title: '内容审核', description: '审核用户发布的帖子和评论。', icon: FileText, path: '/admin/content', feature: '内容审核' },
    { title: '页面内容', description: '管理首页等页面的动态内容。', icon: LayoutTemplate, path: '/admin/page-content', feature: '页面内容' },
    { title: '系统设置', description: '配置应用全局参数和功能开关。', icon: Settings, path: '/admin/settings', feature: '系统设置' },
  ];

  return (
    <>
      <Helmet>
        <title>仪表盘 - 管理后台</title>
        <meta name="description" content="SocialSphere 管理后台仪表盘" />
      </Helmet>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-6 border-b border-gray-200"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎, {profile?.username || 'Admin'}! 这是您的控制中心。</p>
        </motion.div>

        <PlausibleStats />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {adminFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="group"
            >
              <Card 
                onClick={() => handleFeatureClick(feature.path, feature.feature)}
                className="bg-white border-gray-200 h-full flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <span className="text-sm font-medium text-black flex items-center group-hover:text-blue-600 transition-colors">
                    进入
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;