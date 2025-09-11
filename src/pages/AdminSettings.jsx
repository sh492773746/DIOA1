import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Wand2 } from 'lucide-react';
import { fetchWithRetry } from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { supabase: supabaseClient, refreshSiteSettings } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!supabaseClient) return;
    setLoading(true);
    const { data, error } = await fetchWithRetry(() => supabaseClient
      .from('app_settings')
      .select('*')
      .eq('tenant_id', 0) // Fetching main site settings
    );
      
    if (error) {
      toast({
        variant: 'destructive',
        title: '获取设置失败',
        description: error.message,
      });
      setSettings({});
      setInitialSettings({});
    } else {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting;
        return acc;
      }, {});
      setSettings(settingsMap);
      setInitialSettings(JSON.parse(JSON.stringify(settingsMap)));
    }
    setLoading(false);
  }, [toast, supabaseClient]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };
  
  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(initialSettings)));
    toast({
      title: '已重置',
      description: '所有未保存的更改已被撤销。'
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const updates = Object.values(settings)
      .filter(setting => JSON.stringify(setting) !== JSON.stringify(initialSettings[setting.key]))
      .map(({ key, value, name, description, type }) => ({
        key,
        value: String(value),
        name,
        description,
        type,
        tenant_id: 0
      }));

    if (updates.length === 0) {
        toast({ title: '没有需要保存的更改。' });
        setIsSaving(false);
        return;
    }

    const { error } = await supabaseClient.from('app_settings').upsert(updates, {
        onConflict: 'key, tenant_id',
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: '保存设置失败',
        description: error.message,
      });
    } else {
      toast({
        title: '设置已保存',
        description: '系统参数已成功更新。',
      });
      await fetchSettings(); // Re-fetch to get the latest state including any DB-side changes
      refreshSiteSettings(); // Invalidate the query for other components
    }
    setIsSaving(false);
  };
  
  const isChanged = useMemo(() => {
    if (Object.keys(settings).length === 0 || Object.keys(initialSettings).length === 0) {
        return false;
    }
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const renderSettingInput = (key) => {
    const setting = settings[key];
    if (!setting) return null;

    if (setting.type === 'boolean') {
        return (
             <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <Label htmlFor={key} className="text-sm font-medium">{setting.name}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                    id={key}
                    checked={String(setting.value) === 'true'}
                    onCheckedChange={(checked) => handleInputChange(key, String(checked))}
                />
            </div>
        )
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>{setting.name}</Label>
        <Input
          id={key}
          type={setting.type === 'number' ? 'number' : 'text'}
          value={setting.value || ''}
          onChange={(e) => handleInputChange(key, e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      </div>
    );
  };
  
  const settingGroups = {
    '新用户福利': {
      description: '配置新用户注册时获得的初始资源。',
      keys: ['new_user_points', 'initial_virtual_currency', 'new_user_free_posts']
    },
    '邀请系统': {
      description: '管理邀请好友的奖励机制。',
      keys: ['invite_reward_points']
    },
    '社区互动成本': {
      description: '设置用户在社区发帖和评论所需消耗的积分。',
      keys: ['social_post_cost', 'comment_cost', 'ad_post_cost']
    },
    '日常奖励': {
      description: '配置用户通过日常活动（如签到）获得的奖励。',
      keys: ['daily_login_reward']
    },
  };

  const renderSkeleton = () => (
    <div className="space-y-8">
      {Object.keys(settingGroups).map(groupTitle => (
        <Card key={groupTitle}>
          <CardHeader>
            <Skeleton className="h-7 w-1/4" />
            <Skeleton className="h-4 w-2/4 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{String('应用配置 - 管理后台')}</title>
        <meta name="description" content="配置应用的核心经济系统和用户互动参数。" />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto">
        <div className="pb-6 border-b border-gray-200 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">应用配置</h1>
          <p className="mt-1 text-sm text-gray-500">在这里调整应用的核心参数和经济模型。</p>
        </div>
        
        {loading ? renderSkeleton() : (
          <div className="space-y-8">
            {Object.entries(settingGroups).map(([groupTitle, groupDetails]) => (
              <Card key={groupTitle}>
                  <CardHeader>
                    <CardTitle>{groupTitle}</CardTitle>
                    <CardDescription>{groupDetails.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupDetails.keys.map(key => settings[key] ? renderSettingInput(key) : null)}
                  </CardContent>
                </Card>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-2">
          <Button onClick={handleReset} variant="outline" disabled={isSaving || !isChanged}>
            重置
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isChanged}>
            {isSaving ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </motion.div>
    </>
  );
};

export default AdminSettings;