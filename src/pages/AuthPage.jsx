
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, isInitialized, navigate, location.state]);

  const toggleView = () => setIsLoginView(!isLoginView);

  const variants = {
    enter: (isLogin) => ({
      x: isLogin ? '-100%' : '100%',
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (isLogin) => ({
      zIndex: 0,
      x: isLogin ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
    }),
  };
  
  const pageContent = (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black overflow-hidden relative p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <Link to="/" className="absolute top-4 left-4 z-20">
        <Button variant="ghost" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </Link>

        <div className="relative w-full max-w-md min-h-[550px] md:h-auto overflow-hidden flex items-center">
          <AnimatePresence initial={false} custom={isLoginView}>
            <motion.div
              key={isLoginView ? 'login' : 'register'}
              custom={isLoginView}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 }
              }}
              className="absolute w-full"
            >
              {isLoginView ? (
                <Login toggleView={toggleView} />
              ) : (
                <Register toggleView={toggleView} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );

  return pageContent;
};

export default AuthPage;
