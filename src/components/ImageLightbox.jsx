import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

const ImageLightbox = ({ isOpen, onOpenChange, imageUrl, children }) => {
    if (children) {
        return <div onClick={() => onOpenChange(true)}>{children}</div>;
    }

    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-4xl w-full h-full">
                 <VisuallyHidden>
                    <DialogTitle>图片预览</DialogTitle>
                    <DialogDescription>这是一个放大的图片预览。点击外部区域可关闭。</DialogDescription>
                </VisuallyHidden>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-full h-full flex items-center justify-center"
                    onClick={() => onOpenChange(false)}
                >
                    <img
                        src={imageUrl}
                        alt="Enlarged view"
                        className="max-w-full max-h-full object-contain"
                        decoding="async"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageLightbox;