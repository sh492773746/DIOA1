import React from 'react';
import { motion } from 'framer-motion';

const PostImageGrid = ({ images, postId, onImageClick }) => (
  <div className={`grid grid-cols-3 gap-2 mb-4`}>
    {images.map((imageUrl, index) => (
      <div key={imageUrl || index} onClick={() => onImageClick(imageUrl)} className="aspect-square">
        <motion.img
          src={imageUrl} alt={`Post image ${index + 1}`}
          className="w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
          layoutId={`post-image-${postId}-${index}`}
        />
      </div>
    ))}
  </div>
);

export default PostImageGrid;