import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchWithRetry } from '@/lib/api';

const GameCard = ({ game, onGameClick }) => (
    <Card 
        onClick={() => onGameClick(game)}
        className="bg-white rounded-lg shadow-sm border-none text-center p-0.5 flex flex-col items-center justify-between aspect-square cursor-pointer card-hover"
    >
        <div className="w-10 h-10 rounded-md flex items-center justify-center mt-0.5 mb-0.5 overflow-hidden bg-gray-100">
            {game.iconUrl ? (
              <img src={game.iconUrl} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <LucideIcons.Gamepad2 className="w-6 h-6 text-gray-400" />
            )}
        </div>
        <h3 className="text-xs font-semibold text-gray-800 mb-0">{game.title}</h3>
        <p className="text-[10px] text-gray-500 mb-0.5 leading-tight scale-90">{game.description}</p>
        <div className="flex items-center justify-center text-blue-500 text-[10px] mb-0.5 scale-90">
            <LucideIcons.Info className="w-2.5 h-2.5 mr-0.5" />
            {game.info}
        </div>
        <Button variant="gradient" className="w-full text-xs h-6">
            进入游戏
        </Button>
    </Card>
);

const GameCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allGames, setAllGames] = useState({});
  const [gameCategories, setGameCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const fetchGamesAndCategories = async () => {
      setLoading(true);

      // RLS handles tenant data separation, query is simplified
      const { data, error } = await fetchWithRetry(() => supabase
        .from('page_content')
        .select('section, content')
        .eq('page', 'games')
        .eq('is_active', true)
        .order('position', { ascending: true }));

      if (error) {
        toast({ title: '获取游戏数据失败', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      const categoriesData = data
        .filter(item => item.section === 'game_categories')
        .map(item => ({...item.content, id: item.content.slug }));

      const gamesData = data.filter(item => item.section === 'game_cards');

      const gamesByCategory = gamesData.reduce((acc, item) => {
        const game = item.content;
        const category = game.category || 'other';
        (acc[category] = acc[category] || []).push(game);
        return acc;
      }, {});

      setAllGames(gamesByCategory);
      setGameCategories(categoriesData);

      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }

      setLoading(false);
    };

    fetchGamesAndCategories();
  }, [toast]);

  const handleGameClick = (game) => {
    if (game.requiresAuth && !user) {
        toast({
            title: "请先登录",
            description: "此游戏需要登录才能开始。",
            variant: "destructive",
        });
        navigate('/auth');
        return;
    }

    if (game.path) {
      navigate(game.path);
    } else {
       toast({
        title: "🚧 敬请期待",
        description: "该游戏即将上线！",
      });
    }
  };
  
  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
  };

  const displayedGames = useMemo(() => {
    const gamesToShow = allGames[selectedCategory] || [];
    
    if (searchTerm) {
      return gamesToShow.filter(game =>
        game.title && game.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return gamesToShow;
  }, [allGames, selectedCategory, searchTerm]);

  const GameCardSkeleton = () => (
     <Card className="bg-white rounded-lg shadow-sm border-none text-center p-0.5 flex flex-col items-center justify-between aspect-square">
        <Skeleton className="w-10 h-10 rounded-md mt-0.5 mb-0.5" />
        <Skeleton className="h-4 w-16 mb-0" />
        <Skeleton className="h-3 w-20 mb-0.5" />
        <Skeleton className="h-3 w-24 mb-0.5" />
        <Skeleton className="w-full h-6" />
    </Card>
  );
  
  const getCategoryName = () => {
      return gameCategories.find(cat => cat.id === selectedCategory)?.name || "游戏";
  }

  const renderIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Gamepad2;
    return <IconComponent />;
  }

  const DesktopSidebar = () => (
    <aside className="w-32 bg-white p-2 shadow-sm flex-shrink-0">
      <ScrollArea className="h-full pr-2">
        <nav className="space-y-1">
          {gameCategories.map((category) => (
            <motion.div key={category.id} whileHover={{ x: 3 }}>
              <Button
                variant="ghost"
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "w-full justify-start text-sm font-medium px-3 py-2.5 rounded-lg",
                  selectedCategory === category.id
                    ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="flex items-center">
                  {React.cloneElement(renderIcon(category.icon), {className: "w-5 h-5"})}
                  <span className="ml-2">{category.name}</span>
                </span>
                {selectedCategory === category.id && <LucideIcons.ChevronRight className="ml-auto h-4 w-4" />}
              </Button>
            </motion.div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );

  const MobileCategoryNav = () => (
    <div className="px-2 pt-2 bg-white relative">
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex space-x-2 pb-3">
          {gameCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'gradient-light' : 'ghost'}
              size="sm"
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "h-auto py-1.5 px-3 text-sm shrink-0",
                 selectedCategory === category.id ? "text-white" : "text-gray-600 bg-gray-100"
              )}
            >
              <span className="flex items-center">
                {React.cloneElement(renderIcon(category.icon), {className: "w-4 h-4"})}
                <span className="ml-1.5">{category.name}</span>
              </span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-2 pointer-events-none"
           style={{ background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%)' }}>
        <span className="text-xs text-gray-500 mr-1">滑动</span>
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <LucideIcons.ChevronRight className="w-4 h-4 text-gray-500" />
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>游戏中心 - SocialSphere</title>
        <meta name="description" content="畅玩 SocialSphere 的各种趣味游戏" />
      </Helmet>
       <div className={cn("min-h-screen bg-gray-50", isDesktop && "flex")}>
          {isDesktop && !loading && <DesktopSidebar />}
          
          <main className="flex-1 overflow-y-auto">
            {!isDesktop && !loading && <MobileCategoryNav />}
            <div className="p-2 md:p-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                 { !loading &&
                <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-1.5 mb-4 md:mb-6">
                  <LucideIcons.Search className="h-5 w-5 text-gray-400 mr-3" />
                  <Input
                    type="text"
                    placeholder={`在"${getCategoryName()}"中搜索游戏...`}
                    className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base py-2 h-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                }

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                  {loading ? (
                    Array.from({ length: 12 }).map((_, index) => <GameCardSkeleton key={index} />)
                  ) : displayedGames.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 text-lg py-16">
                      <p className="mb-2 text-2xl">🎮</p>
                      <p>该分类下暂无游戏</p>
                      <p className="text-sm mt-1">换个分类看看吧！</p>
                    </div>
                  ) : (
                    displayedGames.map((game, index) => (
                      <GameCard key={`${selectedCategory}-${game.title}-${index}`} game={game} onGameClick={handleGameClick} />
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </main>
      </div>
    </>
  );
};

export default GameCenter;
