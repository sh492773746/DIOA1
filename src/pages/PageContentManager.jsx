import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import ContentItemForm from '@/components/ContentItemForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pageConfig as basePageConfig } from '@/config/pageContentConfig';
import ContentSection from '@/components/admin/ContentSection';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fetchPageContent = async (supabase, tenantId, page) => {
    if (!supabase || tenantId === undefined || !page) return {};
    
    const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page', page)
        .eq('tenant_id', tenantId);

    if (error) {
        console.error(`Error fetching content for page ${page}:`, error);
        throw error;
    }

    const contentMap = data.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {});

    Object.values(contentMap).forEach(sectionItems => {
        sectionItems.sort((a, b) => a.position - b.position);
    });

    return contentMap;
};

const fetchGameCategories = async (supabase) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('page_content')
        .select('content')
        .eq('page', 'games')
        .eq('section', 'game_categories')
        .eq('tenant_id', 0); // Categories are global from main site
    if (error) {
        console.error("Failed to fetch game categories", error);
        return [];
    }
    return data?.map(c => ({
        value: c.content.slug,
        label: c.content.name,
    })) || [];
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

const PageContentManager = () => {
    const navigate = useNavigate();
    const { tenantId: tenantIdFromUrl } = useParams();
    const { isInitialized, isSuperAdmin, isTenantAdmin, supabase, userTenantId } = useAuth();
    const { activeTenantId: tenantIdFromContext } = useTenant();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [pageConfig, setPageConfig] = useState({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activePage, setActivePage] = useState('');
    const [activeSection, setActiveSection] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const managedTenantId = useMemo(() => {
        if(tenantIdFromUrl) return parseInt(tenantIdFromUrl, 10);
        if (isSuperAdmin) {
            return tenantIdFromContext !== null ? tenantIdFromContext : 0;
        }
        return userTenantId;
    }, [tenantIdFromUrl, tenantIdFromContext, isSuperAdmin, userTenantId]);

    useEffect(() => {
        let config = {};
        if (isSuperAdmin || isTenantAdmin) { // Super admin or any tenant admin
            Object.entries(basePageConfig).forEach(([pageKey, pageData]) => {
                const editableSections = pageData.sections.filter(s => isSuperAdmin || s.tenantEditable);
                if (editableSections.length > 0) {
                    config[pageKey] = { ...pageData, sections: editableSections };
                }
            });
        }
        setPageConfig(config);
        const firstPageKey = Object.keys(config)[0];
        if (firstPageKey && !activePage) {
            setActivePage(firstPageKey);
        }
    }, [isSuperAdmin, isTenantAdmin, activePage]);

    const { data: pageContent, isLoading: isContentLoading } = useQuery({
        queryKey: ['pageContent', managedTenantId, activePage],
        queryFn: () => fetchPageContent(supabase, managedTenantId, activePage),
        enabled: isInitialized && managedTenantId !== undefined && !!activePage && !!supabase,
    });

    const { data: categoryOptions } = useQuery({
        queryKey: ['gameCategories'],
        queryFn: () => fetchGameCategories(supabase),
        enabled: isInitialized && !!supabase,
        staleTime: Infinity,
    });

    const { data: managedTenantInfo } = useQuery({
        queryKey: ['tenantInfo', managedTenantId],
        queryFn: () => fetchTenantInfo(supabase, managedTenantId),
        enabled: isInitialized && !!managedTenantId && managedTenantId !== 0 && !!supabase,
    });

    const invalidateContentQueries = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['pageContent', managedTenantId, activePage] });
        queryClient.invalidateQueries({ queryKey: ['dashboardContent', managedTenantId] });
        queryClient.invalidateQueries({ queryKey: ['gamesData', managedTenantId] });
    }, [queryClient, managedTenantId, activePage]);

    const handleFormSubmit = async (values, itemId) => {
        setIsSubmitting(true);
        const currentItems = pageContent?.[activeSection] || [];
        const position = itemId ? currentItems.find(item => item.id === itemId)?.position : currentItems.length;

        const contentData = {
            page: activePage,
            section: activeSection,
            content: values,
            is_active: editingItem?.is_active ?? true,
            position: position,
            tenant_id: managedTenantId
        };

        const { error } = itemId
            ? await supabase.from('page_content').update(contentData).eq('id', itemId)
            : await supabase.from('page_content').insert([contentData]);

        if (error) {
            toast({ title: '保存失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '保存成功', description: '内容已更新' });
            setIsFormOpen(false);
            setEditingItem(null);
            invalidateContentQueries();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('page_content').delete().eq('id', id);
        if (error) {
            toast({ title: '删除失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '删除成功' });
            invalidateContentQueries();
        }
    };

    const handleBatchImport = async (importedData, page, section) => {
        if (!Array.isArray(importedData) || importedData.length === 0) {
            toast({ title: '导入失败', description: 'JSON文件必须是一个非空数组。', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        const currentItems = pageContent?.[section] || [];
        let currentMaxPosition = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.position)) : -1;

        const newItems = importedData.map((itemContent) => ({
            page,
            section,
            content: itemContent,
            is_active: true,
            position: ++currentMaxPosition,
            tenant_id: managedTenantId
        }));

        const { error } = await supabase.from('page_content').insert(newItems);
        if (error) {
            toast({ title: '批量导入失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '批量导入成功', description: `${newItems.length}个项目已添加。` });
            invalidateContentQueries();
        }
        setIsSubmitting(false);
    };

    const handleEdit = (item) => {
        setActiveSection(item.section);
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleAddNew = (sectionId) => {
        setActiveSection(sectionId);
        setEditingItem(null);
        setIsFormOpen(true);
    };
    
    const isManagingSubTenant = isSuperAdmin && managedTenantId !== 0;

    const getTitle = () => {
        if (isManagingSubTenant) return "管辖分站内容";
        if (isSuperAdmin) return "主站内容管理";
        return "页面内容管理";
    };

    const getSubtitle = () => {
        if (isManagingSubTenant) {
            return `正在编辑 ${managedTenantInfo?.desired_domain || ''} (站长: ${managedTenantInfo?.profile?.username || 'N/A'})`;
        }
        if (isSuperAdmin) return "配置主站的动态内容。";
        return "编辑您网站的轮播图、公告、游戏等内容。";
    };

    if (!isInitialized || managedTenantId === undefined) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>;
    }

    const activePageConfig = pageConfig[activePage] || { sections: [] };
    const activeSectionConfig = activePageConfig.sections.find(s => s.id === activeSection) || {};

    return (
        <div className="overflow-x-auto">
            <Helmet>
                <title>{getTitle()} - 管理后台</title>
            </Helmet>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-4">
                    {isManagingSubTenant && (
                        <Button variant="outline" size="icon" onClick={() => navigate('/admin/saas')}>
                            <ArrowLeft className="h-4 w-4 text-foreground" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{getTitle()}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{getSubtitle()}</p>
                    </div>
                </div>
            </motion.div>

            {activePage && (
                <Tabs value={activePage} onValueChange={setActivePage} className="w-full">
                    <TabsList className="overflow-x-auto whitespace-nowrap">
                        {Object.entries(pageConfig).map(([pageId, config]) => (
                            <TabsTrigger key={pageId} value={pageId}>{config.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {Object.entries(pageConfig).map(([pageId, config]) => (
                        <TabsContent key={pageId} value={pageId} className="mt-4">
                            {isContentLoading && activePage === pageId ? (
                                <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /></div>
                            ) : (
                                <div className="space-y-6">
                                    {config.sections.map(section => (
                                        <ContentSection
                                            key={section.id}
                                            sectionConfig={{ ...section, pageId: pageId }}
                                            sectionContent={pageContent?.[section.id] || []}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onReorder={() => {}}
                                            onAddNew={() => handleAddNew(section.id)}
                                            onBatchImport={(data) => handleBatchImport(data, pageId, section.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            )}
            
            {isFormOpen && activeSectionConfig?.fields && (
                <ContentItemForm
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
                    onSubmit={handleFormSubmit}
                    initialData={editingItem}
                    fields={activeSectionConfig.fields || []}
                    title={`${editingItem ? '编辑' : '添加'}“${activeSectionConfig.name}”内容`}
                    loading={isSubmitting}
                    categoryOptions={categoryOptions || []}
                    imageUploaderBucket={activeSection === 'game_cards' ? 'site-assets' : 'page-content-images'}
                />
            )}
        </div>
    );
};

export default PageContentManager;