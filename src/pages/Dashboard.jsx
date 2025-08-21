import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import InteractiveCarousel from '@/components/InteractiveCarousel';
import AnnouncementBar from '@/components/AnnouncementBar';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithRetry } from '@/lib/api';
import GameCard from '@/components/GameCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, appTenantId, isInitialized } = useAuth();
  const [currentFeatureCard, setCurrentFeatureCard] = useState(0);
  const [featureCards, setFeatureCards] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [hotGames, setHotGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const fetchPageContent = useCallback(async (section, setter, setLoadingState, tenantId) => {
    setLoadingState(true);
    let query = supabase
      .from('page_content')
      .select('id, content, position')
      .eq('page', 'home')
      .eq('section', section)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await fetchWithRetry(() => query);
    
    if (error) {
      console.error(`Error fetching ${section}:`, error);
      toast({ title: `获取${section}失败`, description: error.message, variant: 'destructive' });
    } else {
      setter(data.map(item => ({...item.content, id: item.id})));
    }
    setLoadingState(false);
  }, [toast]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const tenantIdToUse = appTenantId;
    fetchPageContent('feature_cards', setFeatureCards, setLoadingFeatures, tenantIdToUse);
    fetchPageContent('hot_games', setHotGames, setLoadingGames, tenantIdToUse);

  }, [fetchPageContent, appTenantId, isInitialized]);

  const nextCard = useCallback(() => {
    if (featureCards.length === 0) return;
    setCurrentFeatureCard(prev => (prev === featureCards.length - 1 ? 0 : prev + 1));
  }, [featureCards.length]);

  const prevCard = () => {
    if (featureCards.length === 0) return;
    setCurrentFeatureCard(prev => (prev === 0 ? featureCards.length - 1 : prev - 1));
  };
  
  useEffect(() => {
    if (featureCards.length > 1) {
      const timer = setTimeout(nextCard, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentFeatureCard, featureCards.length, nextCard]);
  

  const handleNavigate = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      toast({
        title: "请先登录",
        description: "登录后才能访问该页面。",
        variant: "destructive",
      });
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  const cardVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
  };
  
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
    if (newDirection > 0) {
      nextCard();
    } else {
      prevCard();
    }
  };

  const GameCardSkeleton = () => (
     <Card className="bg-white rounded-lg shadow-sm border-none text-center p-0.5 flex flex-col items-center justify-between aspect-square">
        <Skeleton className="w-10 h-10 rounded-md mt-0.5 mb-0.5" />
        <Skeleton className="h-4 w-16 mb-0" />
        <Skeleton className="h-3 w-20 mb-0.5" />
        <Skeleton className="h-3 w-24 mb-0.5" />
        <Skeleton className="w-full h-6" />
    </Card>
  );

  const FeatureCardSkeleton = () => (
    <Card className="bg-gray-200 rounded-xl shadow-lg border-none text-white overflow-hidden h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </CardHeader>
      <CardContent className="flex-grow p-3 pt-0">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardContent>
    </Card>
  );

  const renderFeatureCard = (card) => {
    const IconComponent = LucideIcons[card.icon] || LucideIcons['HelpCircle'];
    return (
      <Card 
        className={`bg-gradient-to-br ${card.style} rounded-xl shadow-lg border-none text-white overflow-hidden cursor-pointer h-full flex flex-col`}
        onClick={() => handleNavigate(card.path)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
          <CardTitle className="text-lg font-bold">{card.title}</CardTitle>
          <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-3 pt-0">
          <p className="text-xs text-white/90">{card.description}</p>
        </CardContent>
      </Card>
    );
  };

  const loadingAll = !isInitialized || loadingFeatures || loadingGames;

  if (loadingAll) {
    return (
       <div className="flex-grow w-full max-w-7xl mx-auto px-0.5 py-0.5">
          <div className="main-content-wrapper p-0.5 sm:p-0.5 lg:p-0.5 space-y-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
             <div className="relative h-40 mb-0.5 flex items-center justify-center">
                <div className="w-[80%] md:w-[40%] absolute">
                    <FeatureCardSkeleton />
                </div>
             </div>
             <Skeleton className="h-6 w-32 rounded-lg" />
             <div className="grid grid-cols-3 md:grid-cols-3 gap-1">
                {Array.from({ length: 3 }).map((_, index) => <GameCardSkeleton key={index} />)}
              </div>
          </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>首页 - SocialSphere</title>
        <meta name="description" content="SocialSphere 首页 - 发现精彩内容，与朋友互动" />
      </Helmet>
      
      <div className="flex-grow w-full max-w-7xl mx-auto px-0.5 py-0.5">
          <div className="main-content-wrapper p-0.5 sm:p-0.5 lg:p-0.5">
            <div className="mb-0.5">
              <InteractiveCarousel />
            </div>

            <div className="mb-0.5">
              <AnnouncementBar />
            </div>

            <div className="relative h-40 mb-0.5 flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction}>
                {featureCards.length > 0 ? (
                  <motion.div
                    key={featureCards[currentFeatureCard].id}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 }
                    }}
                    className="w-[80%] md:w-[40%] absolute"
                  >
                    {renderFeatureCard(featureCards[currentFeatureCard])}
                  </motion.div>
                ) : (
                  <div className="text-center text-gray-500">功能卡片正在配置中...</div>
                )}
              </AnimatePresence>
              {featureCards.length > 1 && (
                <>
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                    <Button variant="ghost" size="icon" onClick={() => paginate(-1)} className="rounded-full bg-white/20 hover:bg-white/40 text-black h-8 w-8">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                    <Button variant="ghost" size="icon" onClick={() => paginate(1)} className="rounded-full bg-white/20 hover:bg-white/40 text-black h-8 w-8">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">推荐游玩</h2>
                <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm" onClick={() => handleNavigate('/games')}>
                  查看全部 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-3 gap-1">
                {hotGames.length > 0 ? hotGames.map((game, index) => (
                  <GameCard key={index} game={game} />
                ))
                : <p className="col-span-3 text-center text-gray-500 py-4">暂无推荐游戏。</p>
                }
              </div>
            </motion.div>
          </div>
      </div>
    </>
  );
};

export default Dashboard;