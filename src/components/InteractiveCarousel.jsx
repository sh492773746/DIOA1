
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithRetry } from '@/lib/api';

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const InteractiveCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [[page, direction], setPage] = useState([0, 0]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCarouselSlides = async () => {
      const { data, error } = await fetchWithRetry(() => supabase
        .from('page_content')
        .select('content')
        .eq('page', 'home')
        .eq('section', 'carousel')
        .eq('is_active', true)
        .order('position', { ascending: true }));

      if (error) {
        console.error('Error fetching carousel slides:', error);
      } else {
        setSlides(data.map(item => item.content));
      }
      setLoading(false);
    };

    fetchCarouselSlides();
  }, []);

  if (loading) {
    return <Skeleton className="w-full h-[200px] rounded-xl" />;
  }

  if (slides.length === 0) {
    return null;
  }

  const imageIndex = Math.abs(page % slides.length);

  const paginate = (newDirection) => {
    if (isExpanded) return;
    setPage([page + newDirection, newDirection]);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  }

  const currentSlide = slides[imageIndex];

  return (
    <motion.div
      layout
      className="relative w-full rounded-xl overflow-hidden shadow-md bg-[#2d2d3a] flex items-center justify-center"
      animate={{ height: isExpanded ? '380px' : '200px' }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute w-full h-full"
          >
            <img 
              alt={currentSlide?.title}
              className="w-full h-full object-cover opacity-30"
             src={currentSlide?.image_url} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-black/30" />
      
      <motion.button
        layout="position"
        className="absolute top-1/2 left-2 transform -translate-y-1/2 z-20 bg-black/20 text-white rounded-full p-1 hover:bg-black/40 transition-colors"
        onClick={() => paginate(-1)}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      <motion.button
        layout="position"
        className="absolute top-1/2 right-2 transform -translate-y-1/2 z-20 bg-black/20 text-white rounded-full p-1 hover:bg-black/40 transition-colors"
        onClick={() => paginate(1)}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      <div className="relative z-10 text-center text-white p-2 flex flex-col items-center">
        <motion.div layout="position" className="flex flex-col items-center">
          <motion.h1
            key={`title-${imageIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold mb-1 shadow-text"
          >
            {currentSlide?.title}
          </motion.h1>
          <motion.p
            key={`desc-${imageIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-sm md:text-base mb-3 shadow-text max-w-md"
          >
            {currentSlide?.description}
          </motion.p>
        </motion.div>
        
        <motion.button 
          layout
          onClick={toggleExpand}
          className="bg-black/40 rounded-full flex items-center justify-center space-x-1.5 text-white transition-all duration-300"
          animate={{ 
            width: isExpanded ? 140 : 100,
            height: isExpanded ? 40 : 50,
            borderRadius: isExpanded ? '20px' : '50%'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div layout="position">
            <Eye className="w-4 h-4"/>
          </motion.div>
          <AnimatePresence>
            {!isExpanded && (
              <motion.span
                layout="position"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="text-xs font-semibold"
              >
                了解更多
              </motion.span>
            )}
          </AnimatePresence>
           <AnimatePresence>
            {isExpanded && (
               <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold"
              >
                收起
              </motion.span>
            )}
           </AnimatePresence>
        </motion.button>
        
        <motion.div 
            layout="position"
            className="flex space-x-2 mt-auto"
        >
        {isExpanded && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-4 text-center"
            >
                <h3 className="font-bold text-base mb-1">更多详情</h3>
                <p className="text-xs max-w-xs text-white/80">这里是展开后显示的详细信息。你可以添加任何你想展示的内容，比如功能介绍、活动详情或者用户评价等等。</p>
            </motion.div>
        )}
        </motion.div>
      </div>

       <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex space-x-1.5">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === imageIndex ? 'bg-blue-500 w-4' : 'bg-gray-400/50 w-1.5'}`}
              />
            ))}
        </div>
    </motion.div>
  );
};

export default InteractiveCarousel;
