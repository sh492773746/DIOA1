import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
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
          invited_by: inviteCode, // Pass the invite code string directly
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="设置一个独特的用户名"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength="6"
            className="mt-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading} variant="gradient">
          {loading ? '注册中...' : '创建账户'}
        </Button>
      </form>
    </motion.div>
  );
};

export default Register;