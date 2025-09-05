import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react'; 

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => setIsLoginView(!isLoginView);

  const pageVariants = {
    initial: { opacity: 0, x: isLoginView ? -100 : 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: isLoginView ? 100 : -100 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 overflow-x-hidden relative">
      <Link 
        to="/" 
        className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-lg shadow-md text-gray-600 hover:text-blue-600 transition-colors z-10"
        aria-label="返回首页"
      >
        <Home className="w-6 h-6" />
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLoginView ? '欢迎来到大海团队' : '注册'}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoginView ? '还没有账户？' : '已经有账户了？'}
          <button onClick={toggleView} className="font-medium text-blue-600 hover:text-blue-500 ml-1 focus:outline-none focus:underline">
            {isLoginView ? '注册' : '立即登录'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative min-h-[480px] h-full w-full px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoginView ? 'login' : 'register'}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute w-full px-4 sm:px-0"
            style={{ left: '50%', translateX: '-50%' }}
          >
            {isLoginView ? <Login /> : <Register />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;