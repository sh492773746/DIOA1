import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import ContentItemForm from '@/components/ContentItemForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pageConfig } from '@/config/pageContentConfig';
import ContentSection from '@/components/admin/ContentSection';
import { fetchWithRetry } from '@/lib/api';

const PageContentManager = () => {
    const [pageContent, setPageContent] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activePage, setActivePage] = useState(Object.keys(pageConfig)[0]);
    const [activeSection, setActiveSection] = useState(pageConfig[Object.keys(pageConfig)[0]].sections[0].id);

    const activePageConfig = useMemo(() => pageConfig[activePage] || { sections: [] }, [activePage]);
    const activeSectionConfig = useMemo(() => {
        return activePageConfig.sections.find(s => s.id === activeSection) || {};
    }, [activePageConfig, activeSection]);
    
    const [categoryOptions, setCategoryOptions] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // RLS will handle tenant data separation
        const { data, error } = await fetchWithRetry(() => supabase
            .from('page_content')
            .select('*')
            .eq('is_active', true)
        );

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

            const categories = content.games?.game_categories?.map(c => ({
                value: c.content.slug,
                label: c.content.name,
            })) || [];
            setCategoryOptions(categories);
        }
        setLoading(false);
    }, [toast]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFormSubmit = async (values, id) => {
        setLoading(true);
        const tenantId = import.meta.env.VITE_TENANT_ID || null;

        const contentData = {
            page: activePage,
            section: activeSection,
            content: values,
            is_active: true,
            position: pageContent[activePage]?.[activeSection]?.length || 0,
            ...(tenantId && { tenant_id: tenantId })
        };

        const { error } = await supabase
            .from('page_content')
            .upsert(id ? { ...contentData, id } : contentData, { onConflict: 'id' });

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
        const updates = reorderedItems.map((item, index) => ({
            id: item.id,
            position: index,
        }));

        const { error } = await supabase.from('page_content').upsert(updates);
        if (error) {
            toast({ title: '排序失败', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: '排序已更新' });
            fetchData();
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };
    
    const handleTabChange = (page, section) => {
        setActivePage(page);
        setActiveSection(section);
        setIsFormOpen(false);
        setEditingItem(null);
    }

    if (loading && !isFormOpen) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-gray-400" /></div>;
    }

    return (
        <>
            <Helmet>
                <title>页面内容管理 - 管理后台</title>
                <meta name="description" content="管理和配置应用中各个页面的动态内容。" />
            </Helmet>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">页面内容管理</h1>
                        <p className="mt-1 text-sm text-gray-500">配置应用中各个页面的动态内容。</p>
                    </div>
                    {!isFormOpen && (
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" /> 添加新内容
                        </Button>
                    )}
                </div>
            </motion.div>

            <Tabs value={activePage} onValueChange={page => handleTabChange(page, pageConfig[page].sections[0].id)} className="w-full">
                <TabsList>
                    {Object.entries(pageConfig).map(([pageId, config]) => (
                        <TabsTrigger key={pageId} value={pageId}>{config.name}</TabsTrigger>
                    ))}
                </TabsList>
                
                {Object.entries(pageConfig).map(([pageId, config]) => (
                    <TabsContent key={pageId} value={pageId} className="mt-4">
                        <Tabs value={activeSection} onValueChange={section => handleTabChange(pageId, section)} orientation="vertical" className="flex gap-6">
                            <TabsList className="flex-col items-start h-auto">
                                {config.sections.map(section => (
                                    <TabsTrigger key={section.id} value={section.id} className="w-full justify-start">{section.name}</TabsTrigger>
                                ))}
                            </TabsList>

                            {config.sections.map(section => (
                                <TabsContent key={section.id} value={section.id} className="flex-grow mt-0">
                                     <ContentSection
                                        sectionConfig={section}
                                        sectionContent={pageContent[pageId]?.[section.id] || []}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onReorder={handleReorder}
                                        onAddNew={handleAddNew}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </TabsContent>
                ))}
            </Tabs>

            <ContentItemForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
                onSubmit={handleFormSubmit}
                initialData={editingItem?.content}
                itemId={editingItem?.id}
                fields={activeSectionConfig.fields || []}
                title={`编辑 "${activeSectionConfig.name}" 内容`}
                loading={loading}
                categoryOptions={categoryOptions}
            />
        </>
    );
};

export default PageContentManager;