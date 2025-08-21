
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from 'lucide-react';
import WeChatPostCard from '@/components/WeChatPostCard';
import { fetchWithRetry } from '@/lib/api';

const PostSkeleton = () => (
    <div className="space-y-4 mt-4">
        <div className="p-4 border rounded-lg bg-white"><div className="flex items-start space-x-3"><div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 w-24 bg-gray-200 animate-pulse" /><div className="h-4 w-full bg-gray-200 animate-pulse" /><div className="h-4 w-4/5 bg-gray-200 animate-pulse" /></div></div></div>
        <div className="p-4 border rounded-lg bg-white"><div className="flex items-start space-x-3"><div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 w-24 bg-gray-200 animate-pulse" /><div className="h-4 w-full bg-gray-200 animate-pulse" /><div className="h-4 w-4/5 bg-gray-200 animate-pulse" /></div></div></div>
    </div>
);

const EmptyState = ({ icon, message, description }) => (
    <div className="text-center py-16 px-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center mb-4 text-gray-400">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-700">{message}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
);

const UserPostHistory = ({ userId }) => {
    const [socialPosts, setSocialPosts] = useState([]);
    const [adPosts, setAdPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async (isAd) => {
        if (!userId) return { data: [], error: null };
        return await fetchWithRetry(() => supabase
            .from('posts')
            .select('*, author:profiles(*), likes(*), comments(*, author:profiles(*)), likes_count:likes(count)')
            .eq('user_id', userId)
            .eq('is_ad', isAd)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
        );
    }, [userId]);

    useEffect(() => {
        const loadAllPosts = async () => {
            setLoading(true);
            const [socialResponse, adResponse] = await Promise.all([
                fetchPosts(false),
                fetchPosts(true)
            ]);

            if (socialResponse.error) console.error("Error fetching social posts:", socialResponse.error.message);
            if (adResponse.error) console.error("Error fetching ad posts:", adResponse.error.message);
            
            setSocialPosts(socialResponse.data ? socialResponse.data.map(p => ({...p, likes_count: p.likes_count?.[0]?.count || 0})) : []);
            setAdPosts(adResponse.data ? adResponse.data.map(p => ({...p, likes_count: p.likes_count?.[0]?.count || 0})) : []);
            setLoading(false);
        };

        loadAllPosts();
    }, [fetchPosts]);

    const handlePostUpdated = useCallback((updatedPost) => {
        const updater = (posts) => posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);
        if (updatedPost.is_ad) {
            setAdPosts(updater);
        } else {
            setSocialPosts(updater);
        }
    }, []);

    const handleDeletePost = useCallback((postId, isAd) => {
        const filterer = (posts) => posts.filter(post => post.id !== postId);
        if (isAd) {
            setAdPosts(filterer);
        } else {
            setSocialPosts(filterer);
        }
    }, []);

    const renderPostList = (posts, isAd) => {
        if (posts.length === 0) {
            const message = isAd ? "白菜区空空如也" : "朋友圈空空如也";
            const description = isAd ? "该用户还没有发布过任何白菜哦！" : "该用户还没有发布过任何动态，快去分享吧！";
            return <EmptyState icon={<FileText className="w-12 h-12" />} message={message} description={description} />;
        }
        return (
            <div className="space-y-4">
                 <AnimatePresence>
                    {posts.map(post => (
                        <WeChatPostCard key={post.id} post={post} onPostUpdated={handlePostUpdated} onDeletePost={(id) => handleDeletePost(id, isAd)} />
                    ))}
                 </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
            <Tabs defaultValue="social" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="social">朋友圈 ({socialPosts.length})</TabsTrigger>
                    <TabsTrigger value="ads">白菜区 ({adPosts.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="social" className="mt-4">
                    {loading ? <PostSkeleton /> : renderPostList(socialPosts, false)}
                </TabsContent>
                <TabsContent value="ads" className="mt-4">
                    {loading ? <PostSkeleton /> : renderPostList(adPosts, true)}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default UserPostHistory;
