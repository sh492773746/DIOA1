
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ImageUploader from '@/components/ImageUploader';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AdminSiteSettings = () => {
    const { toast } = useToast();
    const { isSuperAdmin, profile } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    
    const getTenantIdFromUrl = () => {
        const params = new URLSearchParams(location.search);
        return params.get('tenant_id');
    };

    const tenantIdForQuery = isSuperAdmin ? getTenantIdFromUrl() || profile?.tenant_id : profile?.tenant_id;

    const getQuery = useCallback(() => {
        let query = supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['site_logo_url']);
        
        if (tenantIdForQuery) {
            query = query.eq('tenant_id', tenantIdForQuery);
        } else {
            query = query.is('tenant_id', null);
        }
        return query;
    }, [tenantIdForQuery]);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await getQuery();

            if (error) {
                toast({ title: '加载设置失败', description: error.message, variant: 'destructive' });
            } else {
                const settingsMap = data.reduce((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {});
                setLogoUrl(settingsMap.site_logo_url || '');
            }
            setLoading(false);
        };

        if (profile) {
            fetchSettings();
        }
    }, [getQuery, toast, profile]);

    const handleSave = async () => {
        setSaving(true);
        
        const settingToUpsert = {
            key: 'site_logo_url',
            value: logoUrl,
            type: 'image',
            description: '网站/分站的Logo链接',
            tenant_id: tenantIdForQuery || null,
        };

        const onConflictKey = tenantIdForQuery ? 'key,tenant_id' : 'key';
        
        const { error } = await supabase.from('app_settings').upsert(settingToUpsert, {
            onConflict: onConflictKey,
            ignoreDuplicates: false,
        });


        if (error) {
            toast({ title: '保存失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '设置已保存', description: 'Logo已成功更新。' });
        }
        setSaving(false);
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

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
                            <CardTitle>站点Logo</CardTitle>
                            <CardDescription>
                                上传一个Logo在网站的顶部导航栏展示。Logo将显示为正方形。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="logo-uploader">Logo图片</Label>
                                <ImageUploader
                                    id="logo-uploader"
                                    initialUrl={logoUrl}
                                    onUrlChange={setLogoUrl}
                                    bucketName="site-assets"
                                    hint="最优图片分辨率为 200x200px"
                                    allowUrl={false}
                                    uploaderHeight="h-32"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存设置
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default AdminSiteSettings;