import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite_code');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await signUp(email, password, {
      data: {
        username: username,
        invited_by: inviteCode,
        hostname: window.location.hostname,
      },
    });

    if (error) {
      // Toast is handled in AuthContext
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({
        variant: "destructive",
        title: "注册失败",
        description: "该邮箱已被注册，但未验证。请检查您的邮箱或尝试其他邮箱。",
      });
    } else {
      toast({
        title: "注册成功",
        description: "请检查您的邮箱以完成验证。",
      });
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1"
            placeholder="您的昵称"
          />
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            className="mt-1"
            placeholder="至少6位字符"
          />
        </div>
        {inviteCode && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <p className="text-sm text-blue-800">
              您正在使用邀请码: <span className="font-bold">{inviteCode}</span>
            </p>
          </div>
        )}
        <div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default Register;