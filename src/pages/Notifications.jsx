import React, { useRef, useCallback, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Star, Bell, CheckCheck, Info, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const NOTIFICATIONS_PER_PAGE = 20;

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'like':
      return <div className="bg-red-100 rounded-full p-2"><ThumbsUp className="w-5 h-5 text-red-500" /></div>;
    case 'comment':
      return <div className="bg-blue-100 rounded-full p-2"><MessageCircle className="w-5 h-5 text-blue-500" /></div>;
    case 'system':
      return <div className="bg-purple-100 rounded-full p-2"><Info className="w-5 h-5 text-purple-500" /></div>;
    default:
      return <div className="bg-yellow-100 rounded-full p-2"><Star className="w-5 h-5 text-yellow-500" /></div>;
  }
};

const NotificationSkeleton = () => (
  <div className="flex items-center space-x-4 p-4">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="space-y-2 flex-grow">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

const fetchNotifications = async ({ pageParam = 0, userId }) => {
  if (!userId) return { data: [], nextPage: undefined };

  const from = pageParam * NOTIFICATIONS_PER_PAGE;
  const to = from + NOTIFICATIONS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data,
    nextPage: data.length === NOTIFICATIONS_PER_PAGE ? pageParam + 1 : undefined,
  };
};

const Notifications = () => {
  const { user, siteSettings } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?.id],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam, userId: user.id }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', user?.id] });
      toast({ title: "所有通知已标记为已读" });
    },
    onError: (error) => {
      toast({ title: "无法标记为已读", description: error.message, variant: 'destructive' });
    },
  });

  const markOneAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', user?.id] });
    },
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      markOneAsReadMutation.mutate(notification.id);
    }

    if (notification.type !== 'system' && notification.related_post_id) {
      navigate(`/social#post-${notification.related_post_id}`);
    }
  };

  const getNotificationText = (notification) => {
    switch(notification.type) {
      case 'like':
        return `${notification.content.liker_username} 点赞了你的帖子。`;
      case 'comment':
        return `${notification.content.commenter_username} 评论了: "${(notification.content.comment_content || '').substring(0, 50)}..."`;
      case 'system':
        return `系统通知: ${notification.content.message}`;
      default:
        return '你有一条新通知。';
    }
  }

  const allNotifications = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <>
      <Helmet>
        <title>{String('通知中心 - ' + (siteSettings?.site_name ?? '大海团队'))}</title>
        <meta name="description" content="查看您的所有通知" />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-700" />
              <CardTitle>通知中心</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || !allNotifications.some(n => !n.is_read)}
            >
              {markAllAsReadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
              全部已读
            </Button>
          </CardHeader>
          <CardContent>
            {status === 'pending' ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <NotificationSkeleton key={i} />)}
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-12 text-red-500">
                <p>加载通知失败: {error.message}</p>
              </div>
            ) : allNotifications.length > 0 ? (
              <div className="space-y-2">
                {data.pages.map((page, i) => (
                  <Fragment key={i}>
                    {page.data.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
                          notification.is_read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <NotificationIcon type={notification.type} />
                        <div className="flex-grow">
                          <p className="text-sm text-gray-800">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhCN })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-label="Unread"></div>
                        )}
                      </div>
                    ))}
                  </Fragment>
                ))}
                <div ref={ref} className="flex justify-center items-center p-4">
                  {isFetchingNextPage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : hasNextPage ? (
                    <Button variant="outline" onClick={() => fetchNextPage()}>加载更多</Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">没有更多通知了</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold">没有新通知</h3>
                <p>当有新动态时，我们会在这里通知你。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Notifications;