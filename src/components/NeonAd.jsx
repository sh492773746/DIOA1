import React from 'react';
import { motion } from 'framer-motion';

const NeonAd = ({ title, description, link, imageUrl }) => {
  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-lg overflow-hidden relative group aspect-video md:aspect-[3/1] max-h-[120px]"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-in-out"
        style={{ backgroundImage: `url(${imageUrl})` }}
        whileHover={{ scale: 1.05 }}
      ></motion.div>
      
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center">
        <h3
          className="text-lg md:text-xl font-black text-white uppercase tracking-wider"
        >
          {title}
        </h3>
        <p 
          className="text-xs md:text-sm text-white/80 mt-2"
        >
          {description}
        </p>
      </div>
    </motion.a>
  );
};

export default NeonAd;