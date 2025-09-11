import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsHeader from '@/components/admin/settings/SettingsHeader';
import SettingsForm from '@/components/admin/settings/SettingsForm';
import BulkImportDialog from '@/components/admin/settings/BulkImportDialog';

const fetchTenantSettingsWithFallback = async (supabase, tenantId) => {
    if (!supabase || tenantId === undefined || tenantId === null) return [];
    
    const { data, error } = await supabase.rpc('get_tenant_settings_with_fallback', { p_tenant_id: tenantId });

    if (error) {
        console.error('Error fetching settings with fallback:', error);
        throw error;
    }
    return data || [];
};

const fetchTenantInfo = async (supabase, tenantId) => {
    if (!supabase || !tenantId || tenantId === 0) return null;
    const { data, error } = await supabase
        .from('tenant_requests')
        .select('desired_domain, profile:profiles!user_id(username)')
        .eq('id', tenantId)
        .single();
    if (error) {
        console.error('Error fetching tenant info:', error);
        return null;
    }
    return data;
};

const AdminSiteSettings = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { supabase, isSuperAdmin, userTenantId, isInitialized, isTenantAdmin } = useAuth();
    const { activeTenantId: tenantIdFromContext } = useTenant();

    const [settings, setSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isBulkImportOpen, setBulkImportOpen] = useState(false);
    const [bulkJson, setBulkJson] = useState('');

    const managedTenantId = useMemo(() => {
        if (isSuperAdmin) {
            return tenantIdFromContext !== null ? tenantIdFromContext : 0;
        }
        return userTenantId;
    }, [tenantIdFromContext, isSuperAdmin, userTenantId]);

    const { data: allSettings, isLoading } = useQuery({
        queryKey: ['adminTenantSettings', managedTenantId],
        queryFn: () => fetchTenantSettingsWithFallback(supabase, managedTenantId),
        enabled: isInitialized && managedTenantId !== undefined,
    });

    const { data: managedTenantInfo } = useQuery({
        queryKey: ['tenantInfo', managedTenantId],
        queryFn: () => fetchTenantInfo(supabase, managedTenantId),
        enabled: isInitialized && !!managedTenantId && managedTenantId !== 0,
    });
    
    const tenantEditableKeys = ['site_name', 'site_description', 'site_logo'];

    useEffect(() => {
        if (allSettings) {
            const settingsMap = allSettings.reduce((acc, setting) => {
                acc[setting.key] = { ...setting };
                return acc;
            }, {});
            setSettings(settingsMap);
        }
    }, [allSettings]);

    const handleInputChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], value: value, isCustom: true }
        }));
    };
    
    const handleRevertToDefault = async (key) => {
        setIsSaving(true);
        const { error } = await supabase
            .from('app_settings')
            .delete()
            .eq('tenant_id', managedTenantId)
            .eq('key', key);
        
        if (error) {
            toast({ title: '恢复默认失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '恢复默认成功', description: '设置已恢复为默认值。' });
            queryClient.invalidateQueries({ queryKey: ['adminTenantSettings', managedTenantId] });
        }
        setIsSaving(false);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        
        const settingsToUpsert = Object.entries(settings)
            .filter(([_, setting]) => setting.isCustom)
            .map(([key, setting]) => ({
                tenant_id: managedTenantId,
                key,
                value: String(setting.value),
                name: setting.name,
                description: setting.description,
                type: setting.type,
            }));
            
        if (settingsToUpsert.length > 0) {
            const { error } = await supabase.from('app_settings').upsert(settingsToUpsert, {
                onConflict: 'key, tenant_id',
            });

            if (error) {
                toast({ title: '保存失败', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: '保存成功', description: '站点设置已更新。' });
            }
        } else {
            toast({ title: '无需保存', description: '没有检测到任何更改。' });
        }
        
        queryClient.invalidateQueries({ queryKey: ['adminTenantSettings', managedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['siteSettings', managedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['siteSettings', 0]}); // Invalidate main site settings too
        setIsSaving(false);
    };

    const handleBulkImport = async () => {
        try {
            const parsedJson = JSON.parse(bulkJson);
            if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
                throw new Error("JSON必须是一个对象。");
            }
            
            const updatedSettings = { ...settings };
            let updatedCount = 0;
            for (const key in parsedJson) {
                if (updatedSettings[key]) {
                    if (isSuperAdmin || tenantEditableKeys.includes(key)) {
                        updatedSettings[key] = {
                            ...updatedSettings[key],
                            value: String(parsedJson[key]),
                            isCustom: true
                        };
                        updatedCount++;
                    }
                }
            }
            setSettings(updatedSettings);
            toast({ title: "导入成功", description: `已从JSON更新 ${updatedCount} 个设置项。请点击保存以生效。`});
            setBulkImportOpen(false);
            setBulkJson('');

        } catch (error) {
            toast({ title: "JSON导入失败", description: error.message, variant: "destructive" });
        }
    };
    
    const exportSettings = () => {
        const customSettings = Object.entries(settings)
            .filter(([key, setting]) => setting.isCustom && (isSuperAdmin || tenantEditableKeys.includes(key)))
            .reduce((acc, [key, setting]) => {
                acc[key] = setting.value;
                return acc;
            }, {});
        
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(customSettings, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `settings_tenant_${managedTenantId}.json`;
        link.click();
    };
    
    const isManagingSubTenant = (isSuperAdmin && managedTenantId !== 0) || isTenantAdmin;

    const getTitle = () => {
        if (isSuperAdmin && managedTenantId !== 0) return "管辖分站设置";
        if (isSuperAdmin) return "主站站点设置";
        return "站点设置";
    };

    const getSubtitle = () => {
        if (isSuperAdmin && managedTenantId !== 0) {
            return `正在编辑 ${managedTenantInfo?.desired_domain || ''} (站长: ${managedTenantInfo?.profile?.username || 'N/A'}) 的站点设置`;
        }
        if (isSuperAdmin) return "配置主站的核心参数和默认模板。";
        return "个性化您的站点名称、描述和Logo。";
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <Helmet>
                <title>{getTitle()} - 管理后台</title>
            </Helmet>
            <SettingsHeader 
                title={getTitle()}
                subtitle={getSubtitle()}
                isManagingSubTenant={isSuperAdmin && managedTenantId !== 0}
                onBack={() => navigate('/admin/saas')}
                showActions={isSuperAdmin}
                onBulkImportClick={() => setBulkImportOpen(true)}
                onExportClick={exportSettings}
            />

            <SettingsForm
                settings={settings}
                onInputChange={handleInputChange}
                onRevertToDefault={handleRevertToDefault}
                isSuperAdmin={isSuperAdmin}
                isManagingSubTenant={isManagingSubTenant}
                tenantEditableKeys={tenantEditableKeys}
            />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex justify-end">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    保存更改
                </Button>
            </motion.div>
            
            <BulkImportDialog
              isOpen={isBulkImportOpen}
              onOpenChange={setBulkImportOpen}
              json={bulkJson}
              onJsonChange={setBulkJson}
              onImport={handleBulkImport}
            />
        </>
    );
};

export default AdminSiteSettings;