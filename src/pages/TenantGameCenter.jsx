import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import GameCard from '@/components/GameCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchWithRetry } from '@/lib/api';
import { Loader2, EyeOff } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const IconRenderer = ({ iconName }) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Gamepad2;
    return <IconComponent className="mr-2 h-5 w-5" />;
};

const TenantGameCenter = ({isPreview = false}) => {
    const { toast } = useToast();
    const { user, isInitialized, siteSettings, supabaseClient, tenantId } = useAuth();
    const [categories, setCategories] = useState([]);
    const [games, setGames] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleExitPreview = () => {
        // This component doesn't directly control preview mode like TenantDashboard
        // It might be better to just navigate away or refresh relevant state if needed.
        // For now, let's just toast
        toast({
            title: "功能未实现",
            description: "🚧 此功能尚未实现——但别担心！你可以在下一个提示中请求它！🚀",
            variant: "default",
        });
    }
    
    const fetchGamesAndCategories = useCallback(async () => {
        if (!supabaseClient || tenantId === undefined) {
            setLoading(false);
            return;
        }
        
        setLoading(true);

        const { data, error } = await fetchWithRetry(() =>
            supabaseClient
                .from('page_content')
                .select('section, content')
                .eq('page', 'games')
                .eq('is_active', true)
                .eq('tenant_id', tenantId)
        );

        if (error) {
            toast({ title: '获取游戏数据失败', description: error.message, variant: 'destructive' });
            setLoading(false);
            return;
        }

        const gameCategories = data
            .filter(item => item.section === 'game_categories')
            .map(item => item.content);
        
        const gameCards = data
            .filter(item => item.section === 'game_cards')
            .map(item => item.content);

        const gamesByCat = gameCards.reduce((acc, game) => {
            const cat = game.category_slug || 'all';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(game);
            return acc;
        }, {});

        setCategories(gameCategories);
        setGames(gamesByCat);

        if (gameCategories.length > 0) {
            setActiveCategory(gameCategories[0].slug);
        } else {
            setActiveCategory('all');
        }

        setLoading(false);
    }, [tenantId, supabaseClient, toast]);

    useEffect(() => {
        if (tenantId !== undefined) {
            fetchGamesAndCategories();
        }
    }, [fetchGamesAndCategories, tenantId]);

    const isLoading = !isInitialized || tenantId === undefined || loading;

    const renderSkeleton = () => (
        <>
            <div className="flex space-x-2 p-1 overflow-x-auto mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-full" />
                ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                     <Skeleton key={i} className="w-full aspect-square rounded-lg" />
                ))}
            </div>
        </>
    );

    const activeGames = useMemo(() => {
        if (!activeCategory) return [];
        if (activeCategory === 'all') {
            return Object.values(games).flat();
        }
        return games[activeCategory] || [];
    }, [activeCategory, games]);

    return (
        <>
            <Helmet>
                <title>{String('游戏中心 - ' + (siteSettings?.site_name ?? '大海团队'))}</title>
                <meta name="description" content={`探索${siteSettings?.site_name || '大海团队'}的游戏中心，发现各种精彩游戏。`} />
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isPreview && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6 flex justify-between items-center"
                    >
                        <p className="font-semibold">您正在预览此分站的游戏中心。</p>
                         <Button onClick={handleExitPreview} size="sm" variant="outline">
                            <EyeOff className="mr-2 h-4 w-4" />
                            退出预览
                        </Button>
                    </motion.div>
                )}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-center mb-8 hollow-text">游戏中心</h1>

                    {isLoading ? renderSkeleton() : (
                        categories.length > 0 ? (
                            <>
                                <div className="flex space-x-2 p-1 bg-muted rounded-full overflow-x-auto mb-6 sticky top-16 z-10 backdrop-blur-sm">
                                    {categories.map(category => (
                                        <Button
                                            key={category.slug}
                                            onClick={() => setActiveCategory(category.slug)}
                                            variant="ghost"
                                            className={cn(
                                                "rounded-full flex-shrink-0",
                                                activeCategory === category.slug && 'bg-primary text-primary-foreground hover:bg-primary/90'
                                            )}
                                        >
                                            <IconRenderer iconName={category.icon} />
                                            {category.name}
                                        </Button>
                                    ))}
                                </div>

                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-4"
                                >
                                    {activeGames.map((game, index) => (
                                        <GameCard key={index} game={game} />
                                    ))}
                                </motion.div>
                                {activeGames.length === 0 && (
                                     <div className="text-center py-16">
                                        <div className="text-5xl mb-4">🎮</div>
                                        <p className="text-muted-foreground">此分类下暂无游戏。</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">🚧</div>
                                <h3 className="text-2xl font-semibold text-foreground mb-2">内容建设中...</h3>
                                <p className="text-muted-foreground">游戏中心正在火速搭建中，敬请期待！</p>
                            </div>
                        )
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default TenantGameCenter;