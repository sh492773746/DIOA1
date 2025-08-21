
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

const Register = ({ toggleView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
        toast({
            variant: "destructive",
            title: "注册失败",
            description: "用户名不能为空",
        });
        return;
    }
    setLoading(true);

    const inviteCode = localStorage.getItem('inviteCode');
    
    const { error } = await signUp(email, password, {
        data: {
          username: username,
          invited_by: inviteCode,
        },
        emailRedirectTo: `${window.location.origin}/confirm-email`,
    });

    if (!error) {
        toast({
            title: '🎉 注册成功!',
            description: '我们已向您的邮箱发送了一封确认邮件，请点击链接完成验证。',
            duration: 5000,
        });
        localStorage.removeItem('inviteCode');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 w-full">
      <CardHeader className="text-center space-y-2 pt-8">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
            <UserPlus className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-3xl font-bold text-gray-800">创建账户</CardTitle>
        <CardDescription className="text-gray-600">加入我们，开启新旅程</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="设置一个独特的用户名"
                required
                className="pl-10 h-12 bg-white/50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10 h-12 bg-white/50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码 (至少6位)"
                required
                minLength="6"
                className="pl-10 h-12 bg-white/50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all duration-300"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading} variant="gradient-light" size="lg">
            {loading ? '注册中...' : '创建账户'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="p-6 sm:p-8 pt-0">
        <Button variant="link" className="w-full text-gray-600" onClick={toggleView}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          已经有账户了？返回登录
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Register;
