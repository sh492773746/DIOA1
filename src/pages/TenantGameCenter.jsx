
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import GameCard from '@/components/GameCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchWithRetry } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const IconRenderer = ({ iconName }) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Gamepad2;
    return <IconComponent className="mr-2 h-5 w-5" />;
};

const TenantGameCenter = () => {
    const { toast } = useToast();
    const { user, isInitialized, appTenantId, siteSettings, supabaseClient, tenantIdLoaded } = useAuth();
    const [categories, setCategories] = useState([]);
    const [games, setGames] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    const tenantIdForQuery = appTenantId;

    const fetchGamesAndCategories = useCallback(async () => {
        if (!supabaseClient || tenantIdForQuery === null || tenantIdForQuery === 0) {
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
                .eq('tenant_id', tenantIdForQuery)
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
    }, [tenantIdForQuery, supabaseClient, toast]);

    useEffect(() => {
        if (tenantIdLoaded) {
            fetchGamesAndCategories();
        }
    }, [fetchGamesAndCategories, tenantIdLoaded]);

    const isLoading = !isInitialized || !tenantIdLoaded || loading;

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
                <title>游戏中心 - {siteSettings.site_name}</title>
                <meta name="description" content={`探索${siteSettings.site_name}的游戏中心，发现各种精彩游戏。`} />
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-center mb-8 hollow-text">游戏中心</h1>

                    {isLoading ? renderSkeleton() : (
                        categories.length > 0 ? (
                            <>
                                <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-x-auto mb-6 sticky top-16 z-10 backdrop-blur-sm">
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
                                        <p className="text-gray-500">此分类下暂无游戏。</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">🚧</div>
                                <h3 className="text-2xl font-semibold text-gray-800 mb-2">内容建设中...</h3>
                                <p className="text-gray-500">游戏中心正在火速搭建中，敬请期待！</p>
                            </div>
                        )
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default TenantGameCenter;
