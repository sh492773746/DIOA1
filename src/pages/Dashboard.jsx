import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, ChevronLeft, Gamepad2, TrendingUp, Users, Info } from 'lucide-react';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentCard, setCurrentCard] = useState(0);
  const [gameCards, setGameCards] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    const fetchHotGames = async () => {
      setLoadingGames(true);
      // RLS will handle tenant-specific data, so no need to filter by tenant_id here.
      const { data, error } = await fetchWithRetry(() => supabase
        .from('page_content')
        .select('content')
        .eq('page', 'home')
        .eq('section', 'hot_games')
        .eq('is_active', true)
        .order('position', { ascending: true })
      );
      
      if (error) {
        console.error("Error fetching hot games:", error);
      } else {
        setGameCards(data.map(item => item.content));
      }
      setLoadingGames(false);
    };

    fetchHotGames();
  }, []);

  const featureCards = [
    { title: '朋友圈', description: '分享你的生活点滴，与朋友互动。', icon: <Users className="w-8 h-8 text-white" />, path: '/social', color: 'from-sky-500 to-indigo-500' },
    { title: '游戏中心', description: '畅玩趣味游戏，赢取丰厚积分奖励。', icon: <Gamepad2 className="w-8 h-8 text-white" />, path: '/games', color: 'from-violet-500 to-fuchsia-500' },
    { title: '大神预测', description: '跟随行业大神，把握市场脉搏。', icon: <TrendingUp className="w-8 h-8 text-white" />, path: '/prediction', color: 'from-emerald-500 to-teal-500' },
    { title: '更多功能', description: '敬请期待更多精彩内容。', icon: <Info className="w-8 h-8 text-white" />, path: '/', color: 'from-gray-500 to-gray-700' },
  ];

  const nextCard = () => {
    setCurrentCard(prev => (prev === featureCards.length - 1 ? 0 : prev + 1));
  };

  const prevCard = () => {
    setCurrentCard(prev => (prev === 0 ? featureCards.length - 1 : prev - 1));
  };
  
  useEffect(() => {
    const timer = setTimeout(nextCard, 10000);
    return () => clearTimeout(timer);
  }, [currentCard]);
  

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
    enter: (direction) => {
      return {
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8
      };
    },
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
                  <motion.div
                      key={page}
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
                      <Card 
                          className={`bg-gradient-to-br ${featureCards[currentCard].color} rounded-xl shadow-lg border-none text-white overflow-hidden cursor-pointer h-full flex flex-col`}
                          onClick={() => handleNavigate(featureCards[currentCard].path)}
                      >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                              <CardTitle className="text-lg font-bold">{featureCards[currentCard].title}</CardTitle>
                              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                                  {React.cloneElement(featureCards[currentCard].icon, { className: "w-6 h-6 text-white" })}
                              </div>
                          </CardHeader>
                          <CardContent className="flex-grow p-3 pt-0">
                              <p className="text-xs text-white/90">{featureCards[currentCard].description}</p>
                          </CardContent>
                      </Card>
                  </motion.div>
              </AnimatePresence>
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
                {loadingGames ? (
                  Array.from({ length: 3 }).map((_, index) => <GameCardSkeleton key={index} />)
                ) : (
                  gameCards.map((game, index) => (
                    <Card
                      key={index}
                      className="bg-white rounded-lg shadow-sm border-none text-center p-0.5 flex flex-col items-center justify-between aspect-square"
                      onClick={() => handleNavigate(game.path, game.requiresAuth)}
                    >
                      <div className="w-10 h-10 rounded-md flex items-center justify-center mt-0.5 mb-0.5 overflow-hidden">
                        {game.iconUrl ? (
                          <img src={game.iconUrl} alt={game.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gamepad2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-gray-800 mb-0">{game.title}</h3>
                      <p className="text-[10px] text-gray-500 mb-0.5 leading-tight scale-90">{game.description}</p>
                      <div className="flex items-center justify-center text-blue-500 text-[10px] mb-0.5 scale-90">
                        <Info className="w-2.5 h-2.5 mr-0.5" />
                        {game.info}
                      </div>
                      <Button variant="gradient" className="w-full text-xs h-6">
                        进入游戏
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </div>
      </div>
    </>
  );
};

export default Dashboard;
