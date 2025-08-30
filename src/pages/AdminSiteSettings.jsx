
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchWithRetry } from '@/lib/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const AdminSiteSettings = () => {
    const { tenantId: tenantIdFromUrl } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { supabaseClient, isInitialized, profile, isSuperAdmin, isTenantAdmin } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [managedTenantInfo, setManagedTenantInfo] = useState(null);

    const isTenantAdminPath = location.pathname.startsWith('/tenant-admin');

    const tenantIdForQuery = useMemo(() => {
        if (isTenantAdminPath && isTenantAdmin && profile?.tenant_id) {
            return profile.tenant_id;
        }
        if (isSuperAdmin) {
            return tenantIdFromUrl ? parseInt(tenantIdFromUrl, 10) : 0;
        }
        return undefined;
    }, [isTenantAdminPath, isTenantAdmin, isSuperAdmin, profile, tenantIdFromUrl]);

    const fetchSettings = useCallback(async () => {
        if (!isInitialized || !supabaseClient || tenantIdForQuery === undefined) {
            setLoading(false);
            return;
        }
        setLoading(true);

        if (tenantIdFromUrl && parseInt(tenantIdFromUrl, 10) !== 0) {
            const { data: tenantData, error: tenantError } = await supabaseClient
                .from('tenant_requests')
                .select('desired_domain, user_id')
                .eq('id', tenantIdForQuery)
                .single();
            if (tenantError) {
                toast({ title: '获取分站信息失败', description: tenantError.message, variant: 'destructive' });
            } else {
                setManagedTenantInfo(tenantData);
            }
        }

        const { data, error } = await fetchWithRetry(() =>
            supabaseClient.rpc('get_tenant_settings_with_fallback', { p_tenant_id: tenantIdForQuery })
        );

        if (error) {
            toast({ title: '获取设置失败', description: error.message, variant: 'destructive' });
            setSettings([]);
        } else {
            setSettings(data || []);
        }
        setLoading(false);
    }, [isInitialized, supabaseClient, tenantIdForQuery, toast, tenantIdFromUrl]);

    useEffect(() => {
        // We need to wait for profile to be loaded to get tenantId
        if (isInitialized) {
            fetchSettings();
        }
    }, [fetchSettings, isInitialized]);

    const handleSettingChange = useCallback((key, value) => {
        setSettings(prevSettings => {
            const newSettings = [...prevSettings];
            const settingIndex = newSettings.findIndex(s => s.key === key);
            if (settingIndex > -1) {
                newSettings[settingIndex] = { ...newSettings[settingIndex], value };
            }
            return newSettings;
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        const settingsToSave = settings
            .filter(s => {
                // If it's a tenant admin, they can only save settings that are specific to their tenant.
                // We identify these by checking if the setting's tenant_id matches their own.
                // For super admins, they can save any setting they see.
                return isSuperAdmin || s.tenant_id === tenantIdForQuery;
            })
            .map(setting => ({
                key: setting.key,
                value: setting.value,
                name: setting.name,
                description: setting.description,
                type: setting.type,
                tenant_id: tenantIdForQuery,
            }));

        if (settingsToSave.length === 0) {
            toast({ title: '没有可保存的更改', description: '您没有修改任何属于您权限范围内的设置。', variant: 'default' });
            setIsSaving(false);
            return;
        }

        const { error } = await fetchWithRetry(() =>
            supabaseClient.from('app_settings').upsert(settingsToSave, { onConflict: 'key,tenant_id' })
        );

        if (error) {
            toast({ title: '保存失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '保存成功', description: '站点设置已更新。' });
            fetchSettings();
        }
        setIsSaving(false);
    };

    const getTitle = () => {
        if (isTenantAdminPath) return "我的站点设置";
        if (tenantIdFromUrl) return "管辖分站站点设置";
        return "主站站点设置";
    }

    const getSubtitle = () => {
        if (isTenantAdminPath) return "配置您分站的基本信息和主题。";
        if (tenantIdFromUrl) return `正在编辑 ${managedTenantInfo?.desired_domain || ''}`;
        return "配置主站的基本信息和主题。";
    }

    const filteredSettings = useMemo(() => {
      const editableKeys = ['site_name', 'site_logo_url'];
      if(isSuperAdmin) {
        return settings;
      }
      if(isTenantAdminPath) {
        return settings.filter(s => editableKeys.includes(s.key));
      }
      return [];
    }, [settings, isSuperAdmin, isTenantAdminPath]);


    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>;
    }

    const renderSettingInput = (setting) => {
        switch (setting.type) {
            case 'text':
                return (
                    <Input
                        id={setting.key}
                        value={setting.value || ''}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        id={setting.key}
                        value={setting.value || ''}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <Input
                        id={setting.key}
                        type="number"
                        value={setting.value || ''}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    />
                );

            case 'image':
                return (
                    <ImageUploader
                        initialUrl={setting.value}
                        onUrlChange={(url) => handleSettingChange(setting.key, url)}
                        hint={setting.description}
                        bucketName="site-assets"
                    />
                );
            default:
                return <Input id={setting.key} value={setting.value || ''} readOnly className="bg-gray-100" />;
        }
    };

    return (
        <>
            <Helmet>
                <title>{getTitle()} - 管理后台</title>
            </Helmet>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-4">
                    {tenantIdFromUrl && (
                        <Button variant="outline" size="icon" onClick={() => navigate('/admin/saas')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getTitle()}</h1>
                        <p className="mt-1 text-sm text-gray-500">{getSubtitle()}</p>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>基本设置</CardTitle>
                        <CardDescription>配置站点的名称和Logo。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {filteredSettings.length > 0 ? filteredSettings.map(setting => (
                            <div key={setting.key} className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                                <div className="md:col-span-1 md:text-right">
                                    <Label htmlFor={setting.key} className="font-semibold">{setting.name || setting.key}</Label>
                                    {setting.description && <p className="block text-xs text-gray-500 mt-1">{setting.description}</p>}
                                </div>
                                <div className="md:col-span-3">
                                    {renderSettingInput(setting)}
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-4">没有可配置的设置。</p>
                        )}
                    </CardContent>
                </Card>
                 {filteredSettings.length > 0 && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存设置
                        </Button>
                    </div>
                 )}
            </form>
        </>
    );
};

export default AdminSiteSettings;
