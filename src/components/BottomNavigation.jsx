import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Gamepad2, BarChart2, User, BrainCircuit, TrendingUp, Zap, ChevronUp } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();
  const controls = useAnimation();
  const { user, profile } = useAuth();
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);

  useEffect(() => {
    if (scrollDirection === 'down') {
      controls.start({ y: '100%' });
    } else {
      controls.start({ y: '0%' });
    }
  }, [scrollDirection, controls]);

  useEffect(() => {
    setIsPredictionOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/social', icon: Users, label: '朋友圈' },
    { path: '/games', icon: Gamepad2, label: '游戏' },
    { type: 'popover', icon: BrainCircuit, label: '预测' },
    { path: '/profile', icon: user ? Avatar : User, label: '我的' },
  ];

  const predictionItems = [
    { label: '加拿大28预测', path: '/prediction', icon: BarChart2 },
    { label: '分分28预测', path: '#', icon: TrendingUp, notImplemented: true },
    { label: '比特28预测', path: '#', icon: Zap, notImplemented: true },
  ];
  
  const handleNotImplemented = (label) => {
    toast({
      title: '🚧 功能开发中',
      description: `${label}功能尚未实现，敬请期待！🚀`,
    });
  };

  const navItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      },
    }),
  };

  const renderNavItem = (item, index) => {
    if (item.type === 'popover') {
      const isActive = location.pathname === '/prediction';
      return (
        <Popover key={item.label} open={isPredictionOpen} onOpenChange={setIsPredictionOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 flex justify-center items-center h-full cursor-pointer">
              <motion.div
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors duration-300"
              >
                <div className="relative flex items-center justify-center w-6 h-6 mb-1">
                  <BrainCircuit className={cn('w-6 h-6 transition-all duration-300', isActive || isPredictionOpen ? 'text-blue-600' : 'text-gray-500')} />
                  {(isActive || isPredictionOpen) && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-blue-600 rounded-full"
                    />
                  )}
                </div>
                <span className={cn('transition-colors duration-300 flex items-center', isActive || isPredictionOpen ? 'text-blue-600 font-semibold' : 'text-gray-500')}>
                  {item.label}
                  <ChevronUp className={cn('w-3 h-3 ml-0.5 transition-transform duration-200', isPredictionOpen && 'rotate-180')} />
                </span>
              </motion.div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 mb-2" side="top" align="center">
            <div className="grid gap-1">
              {predictionItems.map((predItem) => (
                <Button
                  key={predItem.label}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    if (predItem.notImplemented) {
                      handleNotImplemented(predItem.label);
                    } else {
                      navigate(predItem.path);
                    }
                    setIsPredictionOpen(false);
                  }}
                >
                  <predItem.icon className="mr-2 h-4 w-4" />
                  {predItem.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    
    const isActive = location.pathname === item.path || (item.path === '/games' && location.pathname.startsWith('/games'));
    const IconComponent = item.icon;

    return (
      <NavLink key={item.path} to={item.path} className="flex-1 flex justify-center items-center h-full">
        <motion.div
          custom={index}
          variants={navItemVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors duration-300"
        >
          <div className="relative flex items-center justify-center w-6 h-6 mb-1">
            {item.path === '/profile' && user ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                <Avatar className={cn('w-7 h-7 border-2', isActive ? 'border-blue-600' : 'border-transparent')}>
                  <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                  <AvatarFallback className="text-xs">{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </motion.div>
            ) : (
              <IconComponent className={cn('w-6 h-6 transition-all duration-300', isActive ? 'text-blue-600' : 'text-gray-500')} />
            )}
            {isActive && item.path !== '/profile' && (
              <motion.div
                layoutId="active-indicator"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-blue-600 rounded-full"
              />
            )}
          </div>
          <span className={cn('transition-colors duration-300', isActive ? 'text-blue-600 font-semibold' : 'text-gray-500')}>
            {item.label}
          </span>
        </motion.div>
      </NavLink>
    );
  };

  return (
    <motion.nav
      animate={controls}
      initial={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-200/80 shadow-t-lg z-50"
    >
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map(renderNavItem)}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;