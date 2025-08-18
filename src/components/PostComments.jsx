
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { fetchWithRetry } from '@/lib/api';

const FALLBACK_COMMENT_COST = 1;
const COMMENT_MAX_LENGTH = 20;
const INITIAL_VISIBLE_COMMENTS = 2;

const PostComments = ({ postId, initialComments = [], onCommentCreated, isWeChatStyle = false, onCommentDeleted }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentCost, setCommentCost] = useState(FALLBACK_COMMENT_COST);

    useEffect(() => {
        const fetchCost = async () => {
            const { data, error } = await fetchWithRetry(() => supabase.from('app_settings').select('value').eq('key', 'comment_cost'));
            if (error || !data || data.length === 0) {
                setCommentCost(FALLBACK_COMMENT_COST);
            } else {
                setCommentCost(parseInt(data[0].value, 10));
            }
        };
        fetchCost();
    }, []);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !profile) return;

        if (profile.points < commentCost) {
            toast({
                title: '积分不足',
                description: `发表评论需要 ${commentCost} 积分。`,
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error } = await fetchWithRetry(() => supabase.rpc('create_comment_and_deduct_points', {
                p_post_id: postId,
                p_user_id: user.id,
                p_content: newComment.trim(),
            }));

            if (error) throw error;

            const newCommentData = data[0];
            const enrichedComment = { ...newCommentData, author: profile };
            onCommentCreated?.(enrichedComment);
            setNewComment('');
            toast({
                title: '评论成功',
                description: `消耗了 ${commentCost} 积分。`,
            });
            await refreshProfile();
        } catch (error) {
            toast({
                title: '❌ 评论失败',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) {
            toast({ title: '删除评论失败', description: error.message, variant: 'destructive' });
        } else {
            onCommentDeleted?.(commentId);
            toast({ title: '评论已删除' });
        }
    };

    const comments = initialComments || [];

    const visibleComments = useMemo(() => {
        return isExpanded ? comments : comments.slice(0, INITIAL_VISIBLE_COMMENTS);
    }, [comments, isExpanded]);

    const handleToggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    if (isWeChatStyle) {
        return (
             <div className="pt-2">
                <AnimatePresence>
                    {visibleComments.map((comment) => (
                         <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            layout
                            className="flex items-start space-x-1.5 text-sm group"
                        >
                            <p className="flex-shrink-0 font-semibold text-blue-600">{comment.author?.username}:</p>
                            <p className="flex-1 text-gray-800 break-all">{comment.content}</p>
                            {user?.id === comment.user_id && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteComment(comment.id)}
                                >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {comments.length > INITIAL_VISIBLE_COMMENTS && (
                    <Button
                        variant="link"
                        size="sm"
                        className="text-xs text-blue-600 p-0 h-auto mt-1"
                        onClick={handleToggleExpand}
                    >
                        {isExpanded ? '收起评论' : `展开剩余 ${comments.length - INITIAL_VISIBLE_COMMENTS} 条评论`}
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                )}
                {user && (
                    <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mt-2">
                        <Input
                            id={`comment-input-${postId}`}
                            type="text"
                            placeholder={`评论 (消耗${commentCost}积分)`}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            maxLength={COMMENT_MAX_LENGTH}
                            className="flex-grow bg-gray-100 border-none rounded-md h-8 text-sm focus:bg-white"
                        />
                         <Button type="submit" size="sm" variant="ghost" disabled={isSubmitting || !newComment.trim()} className="h-8">
                            发送
                        </Button>
                    </form>
                )}
            </div>
        )
    }

    return (
        <div className="pt-2 mt-2 border-t border-gray-100">
            {user && (
                <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mb-2">
                    <Avatar className="w-7 h-7">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                        <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input
                        type="text"
                        placeholder={`添加评论 (消耗${commentCost}积分)`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={COMMENT_MAX_LENGTH}
                        className="flex-grow bg-gray-100 border-none rounded-full h-8 text-sm"
                    />
                    <Button type="submit" size="icon" variant="ghost" disabled={isSubmitting || !newComment.trim()} className="h-8 w-8">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            )}
            <div className="space-y-2">
                <AnimatePresence>
                    {visibleComments.map((comment) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            layout
                            className="flex items-start space-x-2 group"
                        >
                            <Avatar className="w-7 h-7">
                                <AvatarImage src={comment.author?.avatar_url} alt={comment.author?.username} />
                                <AvatarFallback>{comment.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="bg-gray-100 rounded-md px-2 py-1">
                                    <p className="font-semibold text-xs text-gray-800">{comment.author?.username}</p>
                                    <p className="text-xs text-gray-700">{comment.content}</p>
                                </div>
                                <div className="flex items-center">
                                    <p className="text-[10px] text-gray-500 mt-0.5">{formatDistanceToNow(new Date(comment.created_at), { locale: zhCN })}前</p>
                                    {user?.id === comment.user_id && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                            onClick={() => handleDeleteComment(comment.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                 {comments.length > INITIAL_VISIBLE_COMMENTS && (
                    <Button
                        variant="link"
                        size="sm"
                        className="text-xs text-blue-600 p-0 h-auto mt-1 w-full"
                        onClick={handleToggleExpand}
                    >
                        {isExpanded ? '收起' : `展开剩余 ${comments.length - INITIAL_VISIBLE_COMMENTS} 条评论`}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PostComments;
