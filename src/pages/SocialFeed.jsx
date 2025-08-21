import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PostSkeleton from '@/components/PostSkeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeChatPostCard from '@/components/WeChatPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingCreatePostButton from '@/components/FloatingCreatePostButton';
import { fetchWithRetry } from '@/lib/api';

const LoginPrompt = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-xl font-bold mb-2">大海朋友圈</h3>
      <p className="mb-4">登录后即可发布动态、点赞和评论。</p>
      <Link to="/auth">
        <Button variant="outline" className="bg-white/90 text-blue-600 hover:bg-white">
          <LogIn className="mr-2 h-4 w-4" />
          立即登录/注册
        </Button>
      </Link>
    </Card>
  </motion.div>
);

const PinnedAdsSection = () => {
  const [pinnedAds, setPinnedAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPinnedAds = async () => {
      setLoading(true);
      let query = supabase
        .from('page_content')
        .select('content')
        .eq('page', 'social')
        .eq('section', 'pinned_ads')
        .eq('is_active', true)
        .is('tenant_id', null) 
        .order('position', { ascending: true });
      
      const { data, error } = await fetchWithRetry(() => query);

      if (error) {
        console.error('Error fetching pinned ads:', error);
      } else {
        setPinnedAds(data.map(item => item.content));
      }
      setLoading(false);
    };

    fetchPinnedAds();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (pinnedAds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {pinnedAds.map((ad, index) => (
        <motion.a
          key={index}
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-16 rounded-lg overflow-hidden relative group"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${ad.background_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <h3 className="text-white text-sm md:text-base font-bold text-center uppercase tracking-wider">
              {ad.title}
            </h3>
          </div>
        </motion.a>
      ))}
    </div>
  );
};

const SocialFeed = () => {
  const { user, isInitialized } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!inner(*),
        likes(*, author:profiles(username, avatar_url)),
        comments(*, author:profiles!inner(*)),
        likes_count:likes(count)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await fetchWithRetry(() => query);

    if (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } else {
      const postsWithCounts = data.map(post => ({
        ...post,
        likes_count: post.likes_count[0]?.count || 0,
      }));
      setPosts(postsWithCounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      fetchPosts();

      const channel = supabase
        .channel('realtime_posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
            fetchPosts();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
            fetchPosts();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, payload => {
            fetchPosts();
        })
        .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }
  }, [fetchPosts, isInitialized]);

  const handlePostCreated = useCallback((newPost) => {
    setPosts(prev => {
      const sortedPosts = [newPost, ...prev].sort((a,b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
      });
      return sortedPosts;
    });
  }, []);

  const handlePostUpdated = useCallback((updatedPost) => {
    setPosts(prevPosts => {
      const newPosts = prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);
      if (updatedPost.is_pinned !== undefined) {
         return newPosts.sort((a,b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
      }
      return newPosts;
    });
  }, []);

  const handleDeletePost = useCallback((postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);
  
  const { ads, moments } = useMemo(() => {
    return posts.reduce((acc, post) => {
      if (post.is_ad) {
        acc.ads.push(post);
      } else {
        acc.moments.push(post);
      }
      return acc;
    }, { ads: [], moments: [] });
  }, [posts]);

  const isLoading = !isInitialized || loading;

  const renderPostList = (postList, PostComponent, type) => (
    <AnimatePresence>
      {postList.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-6xl mb-4">{type === 'ad' ? '📢' : '🌟'}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {type === 'ad' ? '还没有白菜' : '还没有动态'}
            </h3>
            <p className="text-gray-500">
                {type === 'ad' ? '成为第一个发布白菜信息的人吧！' : '成为第一个分享精彩内容的人吧！'}
            </p>
        </motion.div>
      ) : (
        postList.map(post => (
          <PostComponent
            key={post.id}
            post={post}
            onPostUpdated={handlePostUpdated}
            onDeletePost={handleDeletePost}
          />
        ))
      )}
    </AnimatePresence>
  );

  const WechatPostSkeleton = () => (
      <div className="flex items-start space-x-3 py-4 border-b border-gray-100 last:border-b-0">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-3 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-6 w-10" />
              </div>
            </div>
        </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>朋友圈 - SocialSphere</title>
        <meta name="description" content="查看朋友们的最新动态和白菜信息" />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="space-y-6">
          <PinnedAdsSection />
          
          {!isLoading && !user && <LoginPrompt />}
          
          <Tabs defaultValue="moments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="moments">朋友圈</TabsTrigger>
              <TabsTrigger value="ads">白菜区</TabsTrigger>
            </TabsList>
            <TabsContent value="moments" className="mt-4 bg-white rounded-lg shadow-sm p-4">
              {isLoading ? (
                 <div className="space-y-4">
                  <WechatPostSkeleton />
                  <WechatPostSkeleton />
                 </div>
              ) : renderPostList(moments, WeChatPostCard, 'moment')}
            </TabsContent>
            <TabsContent value="ads" className="mt-4 bg-white rounded-lg shadow-sm p-4">
               {isLoading ? (
                 <div className="space-y-4">
                  <WechatPostSkeleton />
                  <WechatPostSkeleton />
                 </div>
              ) : renderPostList(ads, WeChatPostCard, 'ad')}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {user && <FloatingCreatePostButton onPostCreated={handlePostCreated} />}
    </>
  );
};

export default SocialFeed;