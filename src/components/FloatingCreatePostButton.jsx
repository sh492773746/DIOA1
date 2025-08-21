
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import CreatePost from '@/components/CreatePost';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const FloatingCreatePostButton = ({ onPostCreated, tenantId }) => {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const { user } = useAuth();
    
    if (!user) return null;

    return (
        <>
            <motion.button
                onClick={() => setIsCreatePostOpen(true)}
                className="fixed bottom-20 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg z-50"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Create new post"
            >
                <Plus size={24} />
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
