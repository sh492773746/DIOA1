import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Camera, User, ArrowLeft, Lock } from 'lucide-react';
import { formatDistanceToNow, add } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const EditProfile = () => {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef(null);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const canChangeUsername = useMemo(() => {
    if (!profile?.last_username_update) {
      return true;
    }
    const lastUpdate = new Date(profile.last_username_update);
    const nextAvailableDate = add(lastUpdate, { days: 7 });
    return new Date() > nextAvailableDate;
  }, [profile]);
  
  useEffect(() => {
      if (!canChangeUsername && profile?.last_username_update) {
          const interval = setInterval(() => {
              const lastUpdate = new Date(profile.last_username_update);
              const nextAvailableDate = add(lastUpdate, { days: 7 });
              const distance = formatDistanceToNow(nextAvailableDate, { addSuffix: true, locale: zhCN });
              setCountdown(distance);
          }, 1000);

          return () => clearInterval(interval);
      }
  }, [canChangeUsername, profile?.last_username_update]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: '文件过大',
          description: '头像文件不能超过 1MB。'
        });
        return;
      }
      setNewAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    let finalAvatarUrl = profile.avatar_url;
    
    const usernameChanged = username.trim() !== profile.username;

    if (usernameChanged && !canChangeUsername) {
        toast({
          variant: 'destructive',
          title: '操作受限',
          description: '您每周只能修改一次用户名。'
        });
        setIsSaving(false);
        return;
    }

    if (newAvatarFile) {
      setIsUploading(true);
      const fileExt = newAvatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; 

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, {
            cacheControl: '3600',
            upsert: true
        });

      if (uploadError) {
        toast({ variant: 'destructive', title: '头像上传失败', description: uploadError.message });
        setIsUploading(false);
        setIsSaving(false);
        return;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      finalAvatarUrl = data.publicUrl;
      setIsUploading(false);
    }
    
    const updates = {
      username: username.trim(),
      avatar_url: finalAvatarUrl
    };

    if (usernameChanged) {
        updates.last_username_update = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      toast({ variant: 'destructive', title: '更新失败', description: updateError.message });
    } else {
      toast({ title: '🎉 成功！', description: '您的个人资料已更新。' });
      await refreshProfile();
      navigate('/profile');
    }
    setIsSaving(false);
  };

  if (authLoading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-purple-500" />
      </div>
    );
  }
  
  const isSaveDisabled = isSaving || 
    (!newAvatarFile && (username.trim() === profile?.username || !username.trim()));


  return (
    <>
      <Helmet>
        <title>编辑个人资料 - SocialSphere</title>
        <meta name="description" content="修改您的用户名和头像" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="mb-6">
                <Button asChild variant="ghost">
                  <Link to="/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回个人资料
                  </Link>
                </Button>
              </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">编辑个人资料</CardTitle>
                <CardDescription>在这里更新您的个人信息。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                      <AvatarImage src={avatarUrl} alt={username} />
                      <AvatarFallback className="text-4xl">{username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      variant="gradient"
                      onClick={() => avatarInputRef.current.click()}
                      disabled={isUploading}
                      className="absolute bottom-1 right-1 rounded-full w-10 h-10 p-0"
                    >
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500"/>
                        用户名
                    </Label>
                    <div className="relative">
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="输入您的新用户名"
                          className="text-base"
                          disabled={!canChangeUsername}
                        />
                         {!canChangeUsername && (
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                         )}
                    </div>
                     {!canChangeUsername && (
                        <p className="text-xs text-yellow-600 pt-1">
                            您每周只能修改一次用户名。下次可修改时间: {countdown}.
                        </p>
                    )}
                  </div>
                </div>
                
                <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full" variant="gradient">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? '正在上传头像...' : '正在保存...'}
                    </>
                  ) : '保存更改'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;