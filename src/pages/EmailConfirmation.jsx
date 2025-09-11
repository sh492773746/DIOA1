import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const EmailConfirmation = () => {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error_description')) {
      toast({
        variant: "destructive",
        title: "验证链接无效",
        description: "该链接可能已过期或已被使用。请尝试重新登录或注册。",
      });
    }
  }, [location, toast]);

  return (
    <>
      <Helmet>
        <title>{String('邮箱已验证 - SocialSphere')}</title>
        <meta name="description" content="您的邮箱已经成功验证。" />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-green-100 to-blue-100">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md text-center bg-white/70 backdrop-blur-lg p-8 sm:p-12 rounded-2xl shadow-lg border border-white/30"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-6"
          >
            <MailCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">邮箱已验证！</h1>
          <p className="text-gray-600 mb-8">
            感谢您的确认。现在您可以登录您的账户，开始探索了！
          </p>
          <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link to="/auth">前往登录</Link>
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default EmailConfirmation;