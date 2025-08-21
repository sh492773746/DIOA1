import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ContentItemForm from '@/components/ContentItemForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pageConfig as basePageConfig } from '@/config/pageContentConfig';
import ContentSection from '@/components/admin/ContentSection';
import { fetchWithRetry } from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'react-router-dom';

const PageContentManager = () => {
    const { profile, isInitialized, isTenantAdmin } = useAuth();
    const [pageConfig, setPageConfig] = useState({});
    const [pageContent, setPageContent] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activePage, setActivePage] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const tenantIdForQuery = useMemo(() => {
        if (isTenantAdmin) {
            return profile?.tenant_id;
        }
        return null;
    }, [isTenantAdmin, profile]);

    useEffect(() => {
        let config = {};
        if (isTenantAdmin) {
            Object.entries(basePageConfig).forEach(([pageKey, pageData]) => {
                const tenantSections = pageData.sections.filter(s => s.tenantEditable);
                if (tenantSections.length > 0) {
                    config[pageKey] = { ...pageData, sections: tenantSections };
                }
            });
        } else {
            config = basePageConfig;
        }
        setPageConfig(config);

        const firstPageKey = Object.keys(config)[0];
        if (firstPageKey && config[firstPageKey].sections.length > 0) {
            setActivePage(firstPageKey);
            setActiveSection(config[firstPageKey].sections[0].id);
        } else if (Object.keys(config).length > 0) {
             const fallbackPage = Object.keys(config)[0];
             setActivePage(fallbackPage);
             setActiveSection(null);
             setLoading(false);
        } else {
             setLoading(false);
        }
    }, [isTenantAdmin]);
    
    const activePageConfig = useMemo(() => pageConfig[activePage] || { sections: [] }, [activePage, pageConfig]);
    const activeSectionConfig = useMemo(() => {
        return activePageConfig.sections.find(s => s.id === activeSection) || {};
    }, [activePageConfig, activeSection]);

    const fetchData = useCallback(async () => {
        if (!isInitialized || !activePage) return;
        if (isTenantAdmin && !tenantIdForQuery) {
           return;
        }

        setLoading(true);
        let query = supabase.from('page_content').select('*');
        
        if (isTenantAdmin) {
            query = query.eq('tenant_id', tenantIdForQuery);
        } else {
            query = query.is('tenant_id', null);
        }

        const { data, error } = await fetchWithRetry(() => query);

        if (error) {
            toast({ title: '获取页面内容失败', description: error.message, variant: 'destructive' });
        } else {
            const content = data.reduce((acc, item) => {
                const { page, section } = item;
                if (!acc[page]) acc[page] = {};
                if (!acc[page][section]) acc[page][section] = [];
                acc[page][section].push(item);
                acc[page][section].sort((a, b) => a.position - b.position);
                return acc;
            }, {});
            setPageContent(content);

            const { data: mainCategories } = await fetchWithRetry(() => 
                supabase.from('page_content')
                .select('content')
                .eq('page', 'games')
                .eq('section', 'game_categories')
                .is('tenant_id', null)
            );
            const categories = mainCategories?.map(c => ({
                value: c.content.slug,
                label: c.content.name,
            })) || [];

            setCategoryOptions(categories);
        }
        setLoading(false);
    }, [toast, activePage, tenantIdForQuery, isTenantAdmin, isInitialized]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFormSubmit = async (values, itemId) => {
        setLoading(true);

        const currentItems = pageContent[activePage]?.[activeSection] || [];
        const position = itemId ? currentItems.find(item => item.id === itemId)?.position : currentItems.length;

        const contentData = {
            page: activePage,
            section: activeSection,
            content: values,
            is_active: true,
            position: position,
            tenant_id: tenantIdForQuery
        };
        
        let query;
        if(!itemId) {
            query = supabase.from('page_content').insert([contentData]);
        } else {
            query = supabase.from('page_content').update(contentData).eq('id', itemId);
        }
        
        const { error } = await query;


        if (error) {
            toast({ title: '保存失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '保存成功', description: '内容已更新' });
            setIsFormOpen(false);
            setEditingItem(null);
            fetchData();
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('page_content').delete().eq('id', id);
        if (error) {
            toast({ title: '删除失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '删除成功' });
            fetchData();
        }
    };
    
    const handleReorder = async (reorderedItems) => {
        const updates = reorderedItems.map((item, index) => ({ id: item.id, position: index }));
        const { error } = await supabase.from('page_content').upsert(updates);
        if (error) {
            toast({ title: '排序失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '排序已更新' });
            fetchData();
        }
    };

    const handleBatchImport = async (importedData, page, section) => {
        if (!Array.isArray(importedData) || importedData.length === 0) {
            toast({ title: '导入失败', description: 'JSON文件必须是一个非空数组。', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const currentItems = pageContent[page]?.[section] || [];
        let currentMaxPosition = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.position)) : -1;

        const newItems = importedData.map((itemContent, index) => {
            currentMaxPosition++;
            return {
                page: page,
                section: section,
                content: itemContent,
                is_active: true,
                position: currentMaxPosition,
                tenant_id: tenantIdForQuery
            };
        });

        const { error } = await supabase.from('page_content').insert(newItems);

        if (error) {
            toast({ title: '批量导入失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '批量导入成功', description: `${newItems.length}个项目已添加。` });
            fetchData();
        }
        setLoading(false);
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
    
    const handlePageChange = (page) => {
        setActivePage(page);
        const firstSectionId = pageConfig[page]?.sections[0]?.id;
        setActiveSection(firstSectionId || null);
    }
    
    if (!isInitialized || (loading && !Object.keys(pageContent).length)) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>;
    }
    
    if (Object.keys(pageConfig).length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">此后台没有可管理的内容。</p>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>页面内容管理 - 管理后台</title>
                <meta name="description" content="管理和配置应用中各个页面的动态内容。" />
            </Helmet>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">页面内容管理</h1>
                    <p className="mt-1 text-sm text-gray-500">配置应用中各个页面的动态内容。</p>
                </div>
            </motion.div>

            {activePage && <Tabs value={activePage} onValueChange={handlePageChange} className="w-full">
                <TabsList className="overflow-x-auto whitespace-nowrap">
                    {Object.entries(pageConfig).map(([pageId, config]) => (
                        <TabsTrigger key={pageId} value={pageId}>{config.name}</TabsTrigger>
                    ))}
                </TabsList>
                
                {Object.entries(pageConfig).map(([pageId, config]) => (
                    <TabsContent key={pageId} value={pageId} className="mt-4">
                        <div className="space-y-6">
                            {config.sections.map(section => (
                                <ContentSection
                                    key={section.id}
                                    sectionConfig={{...section, pageId: pageId}}
                                    sectionContent={pageContent?.[pageId]?.[section.id] || []}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onReorder={handleReorder}
                                    onAddNew={() => handleAddNew(section.id)}
                                    onBatchImport={(data) => handleBatchImport(data, pageId, section.id)}
                                />
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>}
            
            {isFormOpen && activeSectionConfig?.fields &&
                <ContentItemForm
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
                    onSubmit={handleFormSubmit}
                    initialData={editingItem}
                    fields={activeSectionConfig.fields || []}
                    title={`${editingItem ? '编辑' : '添加'}“${activeSectionConfig.name}”内容`}
                    loading={loading}
                    categoryOptions={categoryOptions}
                />
            }
        </>
    );
};

export default PageContentManager;