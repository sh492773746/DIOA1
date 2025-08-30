
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Gamepad2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import InteractiveCarousel from '@/components/InteractiveCarousel';
import AnnouncementBar from '@/components/AnnouncementBar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithRetry } from '@/lib/api';
import GameCard from '@/components/GameCard';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';


const FeatureCarousel = ({ cards }) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [Autoplay({ delay: 4000, stopOnInteraction: true })]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const featureCardIcons = useMemo(() => ({
    'MessageSquare': MessageSquare,
    'Gamepad2': Gamepad2,
    'Settings': Settings,
    ...LucideIcons
  }), []);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden py-4 -mx-4 px-4" ref={emblaRef}>
        <div className="flex">
          {cards.map((card, index) => {
            const IconComponent = featureCardIcons[card.icon] || LucideIcons.AppWindow;
            return (
              <div key={index} className="flex-grow-0 flex-shrink-0 basis-full md:basis-1/2 lg:basis-1/3 px-2">
                 <motion.div
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="cursor-pointer"
                >
                  <Button
                    variant="gradient"
                    className={cn(
                      "h-20 w-full rounded-xl shadow-lg",
                      card.style
                    )}
                    onClick={() => card.path ? navigate(card.path) : toast({ title: "🚧 该功能正在开发中", description: "敬请期待更多精彩！" })}
                  >
                    <div className="flex items-center h-full w-full">
                      <motion.div
                        whileHover={{ rotate: [0, 10, -10, 0], transition: { duration: 0.5, repeat: Infinity } }}
                      >
                        <IconComponent className="h-10 w-10 text-white" />
                      </motion.div>
                      <div className="ml-4 text-left">
                          <h3 className="text-md font-bold text-white">{card.title}</h3>
                          <p className="text-xs text-white/80 mt-0.5">{card.description}</p>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="hidden absolute top-1/2 -translate-y-1/2 justify-between w-full pointer-events-none">
        <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur-sm pointer-events-auto" onClick={scrollPrev}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur-sm pointer-events-auto" onClick={scrollNext}>
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isInitialized, siteSettings, supabaseClient, tenantIdLoaded } = useAuth();
  const [pageContent, setPageContent] = useState({
    carousel: [],
    announcements: [],
    feature_cards: [],
    hot_games: [],
  });
  const [loading, setLoading] = useState(true);

  const tenantIdForQuery = 0; // Hardcoded for main site

  const fetchPageContent = useCallback(async () => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const { data, error } = await fetchWithRetry(() =>
      supabaseClient
        .from('page_content')
        .select('section, content, position, is_active, id')
        .eq('page', 'home')
        .eq('is_active', true)
        .eq('tenant_id', tenantIdForQuery)
    );

    if (error) {
      toast({ title: '获取页面内容失败', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const content = data.reduce((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item.content);
      return acc;
    }, {});

    setPageContent({
      carousel: content.carousel || [],
      announcements: content.announcements || [],
      feature_cards: content.feature_cards || [],
      hot_games: content.hot_games || [],
    });
    setLoading(false);
  }, [supabaseClient, toast]);

  useEffect(() => {
    if (tenantIdLoaded) {
      fetchPageContent();
    }
  }, [fetchPageContent, tenantIdLoaded]);

  const isLoading = !isInitialized || !tenantIdLoaded || loading;

  const renderSkeleton = (type) => {
    if (type === 'carousel') {
      return <Skeleton className="w-full h-48 md:h-64 rounded-xl mb-6" />;
    }
    if (type === 'announcement') {
      return <Skeleton className="w-full h-10 rounded-lg mb-6" />;
    }
    if (type === 'feature_cards') {
      return (
        <div className="flex space-x-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="flex-grow-0 flex-shrink-0 basis-1/3 p-2">
                <Skeleton className="w-full h-20 rounded-xl" />
             </div>
          ))}
        </div>
      );
    }
    if (type === 'hot_games') {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="w-full aspect-square rounded-lg" />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{siteSettings.site_name} - 首页</title>
        <meta name="description" content={`欢迎来到${siteSettings.site_name}的首页，体验精彩内容。`} />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {isLoading ? renderSkeleton('carousel') : pageContent.carousel.length > 0 && (
            <InteractiveCarousel items={pageContent.carousel} />
          )}

          {isLoading ? renderSkeleton('announcement') : pageContent.announcements.length > 0 && (
            <AnnouncementBar announcements={pageContent.announcements} />
          )}

          {isLoading ? renderSkeleton('feature_cards') : pageContent.feature_cards.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-center hollow-text">精选功能</h2>
              <FeatureCarousel cards={pageContent.feature_cards} />
            </section>
          )}
          
          {isLoading ? renderSkeleton('hot_games') : pageContent.hot_games.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-center hollow-text">热门推荐</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {pageContent.hot_games.map((game, index) => (
                  <GameCard key={index} game={game} />
                ))}
              </div>
            </section>
          )}

          {!isLoading && pageContent.carousel.length === 0 && pageContent.announcements.length === 0 && pageContent.feature_cards.length === 0 && pageContent.hot_games.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">内容建设中...</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                主站的首页内容正在准备中，敬请期待！
              </p>
              {user && (
                <div className="mt-6 flex justify-center space-x-4">
                  <Button onClick={() => navigate('/social')} variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" /> 去朋友圈看看
                  </Button>
                  <Button onClick={() => navigate('/games')}>
                    <Gamepad2 className="mr-2 h-4 w-4" /> 探索游戏中心
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
