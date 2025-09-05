import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, supabase } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);

    if (error) {
      // Toast is handled in AuthContext
    } else {
      toast({
        title: "登录成功",
        description: "欢迎回来!",
      });
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
    setLoading(false);
  };
  
  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "请输入邮箱", description: "我们需要您的邮箱来发送登录链接。" });
      return;
    }
    setLoading(true);

    if (!supabase) {
      toast({ variant: "destructive", title: "认证服务不可用", description: "请稍后重试。" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
       toast({ variant: "destructive", title: "发送失败", description: error.message });
    } else {
       toast({ title: "检查您的邮箱", description: "我们已向您发送了登录链接！" });
    }
    setLoading(false);
  };

  return (
    <motion.div 
      className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email">邮箱地址</Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">密码</Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Button type="submit" disabled={loading} className="w-full" variant="gradient">
              {loading ? '登录中...' : '登录'}
            </Button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <div className="mt-6">
             <Button variant="outline" onClick={handleMagicLink} disabled={loading} className="w-full">
              使用魔法链接登录
            </Button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Login;