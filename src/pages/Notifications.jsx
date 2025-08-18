
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Star, Bell, CheckCheck, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { fetchWithRetry } from '@/lib/api';

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

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await fetchWithRetry(() => supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching notifications:', error);
      toast({ title: '无法加载通知', variant: 'destructive' });
    } else {
      setNotifications(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
      
    if (error) {
        toast({ title: "无法标记为已读", variant: 'destructive'});
    } else {
        setNotifications(notifications.map(n => ({...n, is_read: true})));
        toast({ title: "所有通知已标记为已读"});
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
        
        if (!error) {
            setNotifications(notifications.map(n => n.id === notification.id ? {...n, is_read: true} : n));
        }
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

  return (
    <>
      <Helmet>
        <title>通知中心 - SocialSphere</title>
        <meta name="description" content="查看您的所有通知" />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-700" />
              <CardTitle>通知中心</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              全部已读
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
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
