import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageSquare, FileText } from 'lucide-react';
import WeChatPostCard from '@/components/WeChatPostCard';

const ActivitySkeleton = () => (
    <div className="space-y-4 mt-4">
        <div className="flex items-start space-x-3 py-4 border-b border-gray-100 last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
        <div className="flex items-start space-x-3 py-4 border-b border-gray-100 last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    </div>
);

const EmptyState = ({ icon, message, description }) => (
    <div className="text-center py-16 px-4">
        <div className="flex justify-center mb-4 text-gray-400">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-700">{message}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
);

const CommentItem = ({ comment }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
    >
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <p className="text-gray-800 mb-3 break-words">"{comment.content}"</p>
                <div className="text-xs text-gray-500">
                    <p>评论于 {format(new Date(comment.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
                    {comment.post ? (
                        <p className="mt-1">
                            在帖子: <Link to={`/social#post-${comment.post.id}`} className="text-blue-600 hover:underline">"{comment.post.content?.substring(0, 30)}..."</Link>
                        </p>
                    ) : (
                        <p className="mt-1 italic">原始帖子已被删除</p>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const UserActivity = ({ userId }) => {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        // MOCK DATA
        setTimeout(() => {
            setPosts([]);
            setComments([]);
            setLoading(false);
        }, 1000)
    }, [userId]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const handlePostUpdated = useCallback((updatedPost) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    }, []);

    const handleDeletePost = useCallback((postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    }, []);

    const renderPosts = () => {
        if (posts.length === 0) {
            return <EmptyState icon={<FileText className="w-12 h-12" />} message="空空如也" description="你还没有发布过任何帖子，快去分享吧！" />;
        }
        return (
            <div className="space-y-4">
                 <AnimatePresence>
                    {posts.map(post => (
                        <WeChatPostCard key={post.id} post={post} onPostUpdated={handlePostUpdated} onDeletePost={handleDeletePost} />
                    ))}
                 </AnimatePresence>
            </div>
        );
    };

    const renderComments = () => {
        if (comments.length === 0) {
            return <EmptyState icon={<MessageSquare className="w-12 h-12" />} message="悄无声息" description="你还没有发表过任何评论，去参与讨论吧！" />;
        }
        return (
            <div className="space-y-2">
                {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="posts">我的帖子 ({posts.length})</TabsTrigger>
                    <TabsTrigger value="comments">我的评论 ({comments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-4">
                    {loading ? <ActivitySkeleton /> : renderPosts()}
                </TabsContent>
                <TabsContent value="comments" className="mt-4">
                    {loading ? <ActivitySkeleton /> : renderComments()}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default UserActivity;