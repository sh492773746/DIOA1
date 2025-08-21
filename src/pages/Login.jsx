import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (!error) {
      toast({
        title: "🎉 登录成功！",
        description: "欢迎回来！"
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Card className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
      <CardHeader className="text-center space-y-2 pt-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
        >
          <LogIn className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-3xl font-bold text-gray-800">欢迎回来</CardTitle>
        <CardDescription className="text-gray-600">使用您的账户登录</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              name="email"
              placeholder="邮箱地址"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 h-12 bg-white/50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-400 transition-all duration-300"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="password"
              name="password"
              placeholder="密码"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 h-12 bg-white/50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-400 transition-all duration-300"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="gradient"
            size="lg"
            className="w-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                登录中...
              </div>
            ) : (
              '立即登录'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Login;