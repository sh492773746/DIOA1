import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const InvitePage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteCode) {
      // Use localStorage for better persistence across tabs/sessions until cleared
      localStorage.setItem('inviteCode', inviteCode);
    }
  }, [inviteCode]);

  const handleJoin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 text-center">
          <CardHeader className="pt-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-800 mt-4">你被邀请了！</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              加入 SocialSphere，与朋友们一起探索乐趣！
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl mb-6">
              <div className="flex items-start">
                <Users className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-700">加入社区</h3>
                  <p className="text-sm text-gray-500">成为我们充满活力的社区的一员。</p>
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-700">获得奖励</h3>
                  <p className="text-sm text-gray-500">注册即可获得丰厚的欢迎礼包！</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              你的邀请码 <strong className="text-gray-700">{inviteCode}</strong> 已自动应用。
            </p>

            <Button
              onClick={handleJoin}
              variant="gradient"
              size="lg"
              className="w-full shadow-lg transform hover:scale-105 transition-transform duration-300 text-lg"
            >
              立即加入
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InvitePage;