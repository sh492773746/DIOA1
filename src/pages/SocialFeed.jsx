import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInView } from 'react-intersection-observer';
import WeChatPostCard from '@/components/WeChatPostCard';
import PostSkeleton from '@/components/PostSkeleton';
import FloatingCreatePostButton from '@/components/FloatingCreatePostButton';
import { motion } from 'framer-motion';
import NeonAd from '@/components/NeonAd';
import { usePageContent } from '@/hooks/usePageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const POSTS_PER_PAGE = 10;

const NotLoggedInPrompt = () => {
    const navigate = useNavigate();
    return (
        <Card className="my-8 text-center bg-secondary/30 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <LogIn className="w-6 h-6 text-primary" />
                    解锁全部内容
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    登录后查看更多精彩内容，并与大家互动！
                </p>
                <Button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90">
                    立即登录/注册
                </Button>
            </CardContent>
        </Card>
    );
};


const SocialFeed = () => {
    const { siteSettings, isInitialized, user } = useAuth();
    const { isLoading: isTenantLoading } = useTenant();
    const [activeTab, setActiveTab] = useState('social');
    const { ref } = useInView({ threshold: 0.5 });
    
    const { data: pinnedAds, isLoading: isPinnedAdsLoading } = usePageContent('home', 'pinned_ads');
    
    const allPosts = [];
    const isFetching = false;
    const isFetchingNextPage = false;
    const hasNextPage = false;
    const status = 'success';
    const error = null;
    const refetch = () => {};

    const renderSkeletons = () => (
        Array.from({ length: 3 }).map((_, index) => <PostSkeleton key={index} />)
    );

    const renderFeedContent = () => {
        if (status === 'pending') {
            return renderSkeletons();
        }
        if (status === 'error') {
            return (
                <div className="text-center py-10 text-red-500">
                    <p>加载失败: {error.message}</p>
                    <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                        重试
                    </button>
                </div>
            );
        }
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {allPosts.length > 0 ? (
                    allPosts.map(post => (
                        <WeChatPostCard key={post.id} post={post} onPostUpdated={refetch} onDeletePost={refetch} />
                    ))
                ) : (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">内容加载中或尚未发布动态。</p>
                    </div>
                )}
                 {!user && <NotLoggedInPrompt />}
                <div ref={ref} className="h-10">
                  {isFetchingNextPage && <PostSkeleton />}
                  {!hasNextPage && allPosts.length > 0 && <p className="text-center text-muted-foreground py-4">没有更多内容了</p>}
                </div>
            </motion.div>
        );
    };

    return (
        <>
            <Helmet>
                <title>{`${siteSettings?.site_name || '大海团队'} - ${activeTab === 'social' ? '朋友圈' : '白菜专区'}`}</title>
                <meta name="description" content={`看看大家在${siteSettings?.site_name || '大海团队'}的${activeTab === 'social' ? '朋友圈' : '白菜专区'}分享了什么新鲜事。`} />
            </Helmet>

            <div className="max-w-xl mx-auto pb-20">
                <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-10 p-2 rounded-b-lg">
                    <div className="flex bg-muted p-1 rounded-full">
                        <button onClick={() => setActiveTab('social')} className={`w-full py-2 rounded-full transition-colors text-sm font-semibold ${activeTab === 'social' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                            朋友圈
                        </button>
                        <button onClick={() => setActiveTab('ads')} className={`w-full py-2 rounded-full transition-colors text-sm font-semibold ${activeTab === 'ads' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                            白菜专区
                        </button>
                    </div>
                </div>

                <div className="pt-4 space-y-4 px-2 md:px-0">
                   {isPinnedAdsLoading ? <Skeleton className="w-full h-[120px] rounded-lg" /> :
                     pinnedAds && pinnedAds.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {pinnedAds.map((ad, index) => (
                                <NeonAd 
                                    key={index} 
                                    title={ad.title} 
                                    description={ad.description} 
                                    link={ad.link_url} 
                                    imageUrl={ad.background_image_url} 
                                />
                            ))}
                        </div>
                   )}
                   {renderFeedContent()}
                </div>
            </div>
            
            <FloatingCreatePostButton onPostCreated={refetch} />
        </>
    );
};

export default SocialFeed;