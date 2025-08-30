import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plus } from 'lucide-react';
import CreatePost from '@/components/CreatePost';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const FloatingCreatePostButton = ({ onPostCreated, tenantId }) => {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const { user } = useAuth();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    if (!user) return null;

    const buttonVariants = {
        hidden: { y: "150%", opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const contentVariants = {
        hidden: { width: 0, opacity: 0, transition: { duration: 0.2 } },
        visible: { width: "auto", opacity: 1, transition: { delay: 0.1, duration: 0.2 } }
    };

    return (
        <>
            <motion.button
                variants={buttonVariants}
                initial="visible"
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.3 }}
                onClick={() => setIsCreatePostOpen(true)}
                className="fixed bottom-20 right-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full h-12 flex items-center justify-center shadow-lg z-50 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Create new post"
            >
                <div className="px-4">
                    <Plus size={24} />
                </div>
                <motion.div
                    variants={contentVariants}
                    initial={isDesktop ? "visible" : "hidden"}
                    animate={isDesktop && !hidden ? "visible" : "hidden"}
                    className="pr-5 whitespace-nowrap"
                >
                    <span className="font-semibold">创建帖子</span>
                </motion.div>
            </motion.button>
            <CreatePost 
                isOpen={isCreatePostOpen}
                setIsOpen={setIsCreatePostOpen}
                onPostCreated={onPostCreated}
                tenantId={tenantId}
            />
        </>
    );
};

export default FloatingCreatePostButton;