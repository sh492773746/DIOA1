import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ImageUploader';
import { Loader2, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { fetchWithRetry } from '@/lib/api';

const AdminSiteSettings = () => {
    const { toast } = useToast();
    const { isSuperAdmin, profile } = useAuth();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});
    const [initialSettings, setInitialSettings] = useState({});

    const getTenantIdFromUrl = () => {
        const params = new URLSearchParams(location.search);
        let tenantId = params.get('tenant_id');
        // Fallback for tenant admins who might not have it in the URL
        if (!tenantId && !isSuperAdmin) {
            tenantId = profile?.tenant_id;
        }
        return tenantId;
    };
    
    const tenantIdForQuery = getTenantIdFromUrl();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('app_settings')
            .select('*')
            .in('key', ['site_name', 'site_logo_url']);
        
        if (tenantIdForQuery) {
            query = query.eq('tenant_id', tenantIdForQuery);
        } else {
            query = query.is('tenant_id', null);
        }

        const { data, error } = await fetchWithRetry(() => query);

        if (error) {
            toast({ title: '加载设置失败', description: error.message, variant: 'destructive' });
        } else {
            const settingsMap = data.reduce((acc, item) => {
                acc[item.key] = item;
                return acc;
            }, {});
            setSettings(settingsMap);
            setInitialSettings(JSON.parse(JSON.stringify(settingsMap)));
        }
        setLoading(false);
    }, [tenantIdForQuery, toast]);

    useEffect(() => {
        if (profile) {
            fetchSettings();
        }
    }, [fetchSettings, profile]);
    
    const handleInputChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...(prev[key] || {}), value },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        
        const updates = Object.values(settings).map(setting => ({
            ...setting,
            tenant_id: tenantIdForQuery || null,
        }));
        
        const { error } = await supabase.from('app_settings').upsert(updates, {
            onConflict: tenantIdForQuery ? 'key,tenant_id' : 'key',
        });

        if (error) {
            toast({ title: '保存失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '设置已保存', description: '站点设置已成功更新。' });
            await fetchSettings();
        }
        setSaving(false);
    };

    const isChanged = useMemo(() => {
      return JSON.stringify(settings) !== JSON.stringify(initialSettings);
    }, [settings, initialSettings]);

    const renderSettingInput = (key) => {
        const setting = settings[key];
        if (!setting) return null;

        switch(setting.type) {
            case 'image':
                return (
                    <div key={key}>
                        <Label htmlFor={key}>{setting.name || 'Logo图片'}</Label>
                        <ImageUploader
                            id={key}
                            initialUrl={setting.value}
                            onUrlChange={(url) => handleInputChange(key, url)}
                            bucketName="site-assets"
                            hint="最优图片分辨率为 200x200px"
                            allowUrl={false}
                            uploaderHeight="h-32"
                        />
                    </div>
                );
            case 'text':
            default:
                return (
                    <div key={key}>
                        <Label htmlFor={key}>{setting.name || '设置项'}</Label>
                        <Input
                            id={key}
                            value={setting.value || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                    </div>
                );
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    
    const settingsOrder = ['site_name', 'site_logo_url'];

    return (
        <>
            <Helmet>
                <title>站点设置 - 管理后台</title>
            </Helmet>
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">站点设置</h1>
                    <p className="mt-1 text-sm text-gray-500">管理站点的全局视觉元素和信息。</p>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5" /> 基本信息</CardTitle>
                            <CardDescription>
                                配置您的站点名称和Logo，这些信息将对所有用户可见。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {settingsOrder.map(key => renderSettingInput(key))}
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleSave} disabled={saving || !isChanged}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存更改
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default AdminSiteSettings;