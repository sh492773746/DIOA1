import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Wand2 } from 'lucide-react';
import { fetchWithRetry } from '@/lib/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchWithRetry(() => supabase
      .from('app_settings')
      .select('*')
      .is('tenant_id', null)
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
  }, [toast]);

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
    
    let newEmbedCode = null;
    const oldKey = initialSettings['iframe_obfuscation_key']?.value;
    const newKey = settings['iframe_obfuscation_key']?.value;
    
    if (newKey && newKey !== oldKey) {
      const unlockKey = newKey;
      const iframeSrc = window.location.origin;
      newEmbedCode = `
<iframe 
  id="embedded-social-app"
  src="${iframeSrc}"
  style="width: 100%; height: 800px; border: 1px solid #ccc; border-radius: 8px;"
  frameborder="0"
  allow="fullscreen"
></iframe>

<script>
  (function() {
    const iframe = document.getElementById('embedded-social-app');
    const unlockKey = '${unlockKey}';
    const targetOrigin = '${iframeSrc}';

    function sendMessage() {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'DEOBFUSCATE',
          key: unlockKey
        }, targetOrigin);
      }
    }

    if (iframe.attachEvent) { // For older browsers
        iframe.attachEvent('onload', sendMessage);
    } else {
        iframe.onload = sendMessage;
    }

    // Fallback in case 'load' event has already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(sendMessage, 500);
    }
  })();
<\/script>
      `.trim();
      
      setSettings(prev => ({
        ...prev,
        'iframe_embed_code': { ...prev['iframe_embed_code'], value: newEmbedCode },
      }));
    }

    const updates = Object.values(settings).map(({ key, value, description, type, id }) => ({
      id,
      key,
      value: String(value),
      description,
      type,
      tenant_id: null
    }));

    if (newEmbedCode !== null) {
      const embedCodeSetting = updates.find(s => s.key === 'iframe_embed_code');
      if (embedCodeSetting) {
        embedCodeSetting.value = newEmbedCode;
      }
    }
    
    const { error } = await supabase.from('app_settings').upsert(updates, {
        onConflict: 'id',
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
      fetchSettings();
    }
    setIsSaving(false);
  };
  
  const isChanged = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const generateRandomKey = () => {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  };

  const handleGenerateKey = () => {
      const newKey = generateRandomKey();
      handleInputChange('iframe_obfuscation_key', newKey);
      toast({
          title: '新密钥已生成',
          description: '请记得点击“保存更改”以生效。'
      });
  };

  const renderSettingInput = (key) => {
    const setting = settings[key];
    if (!setting || setting.key === 'iframe_embed_code') return null;

    if (key === 'iframe_obfuscation_key') {
        return (
            <div key={key} className="space-y-2">
                <Label htmlFor={key}>{setting.description}</Label>
                <div className="flex space-x-2">
                    <Input
                      id={key}
                      type="text"
                      value={setting.value || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={handleGenerateKey}>
                        <Wand2 className="h-4 w-4 mr-2" /> 生成
                    </Button>
                </div>
            </div>
        )
    }

    if (setting.type === 'boolean') {
        return (
             <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor={key} className="text-base">{setting.description || key}</Label>
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
        <Label htmlFor={key}>{setting.description}</Label>
        <Input
          id={key}
          type={setting.type === 'number' ? 'number' : 'text'}
          value={setting.value || ''}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="bg-gray-50"
        />
      </div>
    );
  };
  
  const settingGroups = {
    '轮播图设置': ['carousel_overlay_opacity'],
    'iFrame 加密设置': ['iframe_content_obfuscation_enabled', 'iframe_obfuscation_key'],
    '发帖与互动成本': ['ad_post_cost', 'social_post_cost', 'comment_cost'],
    '新用户初始福利': ['new_user_points', 'new_user_free_ads'],
    '奖励系统': ['daily_login_reward', 'invite_reward_points'],
  };

  if (loading) {
    return (
      <div>
        <Helmet>
          <title>系统设置 - 管理后台</title>
        </Helmet>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">系统设置</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
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
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>系统设置 - 管理后台</title>
        <meta name="description" content="配置 SocialSphere 应用的全局参数。" />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="pb-6 border-b border-gray-200 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="mt-1 text-sm text-gray-500">在这里调整应用的核心参数和经济模型。</p>
        </div>

        <div className="space-y-8">
          {Object.entries(settingGroups).map(([groupTitle, keys]) => (
             <Card key={groupTitle}>
                <CardHeader>
                  <CardTitle>{groupTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keys.map(key => settings[key] ? renderSettingInput(key) : null)}
                </CardContent>
              </Card>
          ))}
        </div>

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