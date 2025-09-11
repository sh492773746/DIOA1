import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      toast({
        title: '🎉 登录成功!',
        description: '欢迎回来!',
      });
      navigate('/');
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!session) {
        toast({
          variant: 'destructive',
          title: '登录超时',
          description: '未能获取您的会话信息，请重试。',
        });
        navigate('/auth');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);

  }, [session, navigate, toast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-purple-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
        <p className="text-lg font-semibold text-gray-700">正在安全地将您登录...</p>
        <p className="text-sm text-gray-500">请稍候，我们正在验证您的会话。</p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;