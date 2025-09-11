import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase as supabaseClient } from '@/lib/customSupabaseClient';
import WeChatPostCard from '@/components/WeChatPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const fetchUserPosts = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabaseClient
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      is_ad,
      is_pinned,
      status,
      rejection_reason,
      image_urls,
      edit_count,
      tenant_id,
      author:profiles(id, username, avatar_url, role),
      comments(id),
      likes(user_id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user posts:", error);
    throw new Error(error.message);
  }

  return data.map(post => ({
    ...post,
    likes_count: post.likes?.length || 0,
    comments_count: post.comments?.length || 0,
    likes: post.likes || [],
    comments: post.comments || [],
  }));
};

const PostSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4 md:p-6">
    <div className="flex items-start space-x-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
);

const UserPostHistory = ({ userId }) => {
  const { data: posts, isLoading, isError, error } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>加载动态失败: {error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-gray-50 rounded-lg"
      >
        <div className="text-5xl mb-4">🤷‍♂️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">朋友圈空空如也</h3>
        <p className="text-sm text-gray-500">该用户还没有发布过任何动态。</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <WeChatPostCard key={post.id} post={post} onPostUpdated={() => {}} onDeletePost={() => {}} />
      ))}
    </div>
  );
};

export default UserPostHistory;