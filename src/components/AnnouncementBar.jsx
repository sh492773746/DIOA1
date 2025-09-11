import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AnnouncementBar = ({ announcements, isLoading }) => {
  const marqueeVariants = {
    animate: {
      x: ['0%', '-100%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 25,
          ease: 'linear',
        },
      },
    },
  };

  if (isLoading) {
    return <Skeleton className="h-8 w-full rounded-lg bg-secondary" />;
  }
  
  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center h-8 bg-secondary rounded-lg overflow-hidden shadow-md border border-border">
      <div className="flex-shrink-0 px-2 flex items-center justify-center bg-secondary h-full">
        <Volume2 className="w-4 h-4 text-foreground" />
      </div>
      <div className="flex-grow overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          variants={marqueeVariants}
          animate="animate"
        >
          {announcements.map((item, index) => (
            <span key={index} className="text-foreground text-xs font-medium px-8">{item.text}</span>
          ))}
          {announcements.map((item, index) => (
            <span key={`duplicate-${index}`} className="text-foreground text-xs font-medium px-8">{item.text}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AnnouncementBar;