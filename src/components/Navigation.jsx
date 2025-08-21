
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Gamepad2, LogOut, Coins, Menu, X, Bell, Star, MessageCircle, ThumbsUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { fetchWithRetry } from '@/lib/api';

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'like':
      return <ThumbsUp className="w-4 h-4 text-red-500" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'system':
      return <Info className="w-4 h-4 text-purple-500" />;
    default:
      return <Star className="w-4 h-4 text-yellow-500" />;
  }
};

const getNotificationText = (notification) => {
    switch(notification.type) {
      case 'like':
        return `${notification.content.liker_username} 点赞了你的帖子。`;
      case 'comment':
        return `${notification.content.commenter_username} 评论了: "${(notification.content.comment_content || '').substring(0, 20)}..."`;
      case 'system':
        return `系统通知: ${notification.content.message.substring(0, 25)}...`;
      default:
        return '你有一条新通知。';
    }
}


const Navigation = () => {
  const { profile, signOut, user, appTenantId, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoUrl, setLogoUrl] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await fetchWithRetry(() => supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5));

    if (error) {
      console.error('Error fetching notifications', error);
    } else {
      setNotifications(data);
    }
  }, [user]);
    
  const fetchUnreadCount = useCallback(async () => {
      if (!user) return;
      const { count, error } = await fetchWithRetry(() => supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false));
      
      if (error) {
          console.error('Error fetching unread count', error);
      } else {
          setUnreadCount(count);
      }
  }, [user]);

  const fetchLogo = useCallback(async () => {
    let query = supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'site_logo_url');
    
    if (appTenantId) {
      query = query.eq('tenant_id', appTenantId);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching site logo:', error);
    } else if (data) {
      setLogoUrl(data.value);
    }
  }, [appTenantId]);

  useEffect(() => {
    if (!isInitialized) return;
    fetchLogo();

    const channel = supabase.channel(`site_settings_logo_channel_${appTenantId || 'main'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: `key=eq.site_logo_url`}, 
        (payload) => {
            if ((appTenantId && payload.new.tenant_id === appTenantId) || (!appTenantId && payload.new.tenant_id === null)) {
                fetchLogo();
            }
        }
      )
      .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }
  }, [fetchLogo, isInitialized, appTenantId]);


  useEffect(() => {
    if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    };

    fetchNotifications();
    fetchUnreadCount();

    const channel = supabase
        .channel('realtime-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`}, 
        (payload) => {
            fetchNotifications();
            fetchUnreadCount();
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }

  }, [user, fetchNotifications, fetchUnreadCount]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleMarkAsRead = async (id) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) {
        toast({ title: "Error marking notification as read", variant: "destructive" });
    }
  };

  const handleNavigateToNotification = (notification) => {
    handleMarkAsRead(notification.id);
    if(notification.type !== 'system' && notification.related_post_id) {
        navigate(`/social#post-${notification.related_post_id}`);
    } else {
        navigate('/notifications');
    }
  }


  const navItems = [
    { path: '/', label: '首页' },
    { path: '/social', label: '朋友圈' },
    { path: '/games', label: '游戏中心' },
    { path: '/prediction', label: '预测' },
    { path: '/profile', label: '我的' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center text-2xl font-bold text-gray-800">
            {logoUrl ? (
              <img src={logoUrl} alt="Site Logo" className="h-8 w-8 rounded-[4px] object-contain" />
            ) : (
              'DH'
            )}
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} className="text-gray-600 hover:text-blue-600 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-blue-600">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>通知</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} onClick={() => handleNavigateToNotification(notification)} className={`flex items-start gap-3 p-2 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                          <NotificationIcon type={notification.type} />
                          <div className="flex-1">
                             <p className="text-sm">
                                {getNotificationText(notification)}
                             </p>
                             <p className="text-xs text-gray-500">
                               {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhCN })}
                             </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-4">
                        没有新通知
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/notifications')} className="justify-center">
                        查看全部通知
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">{profile?.points || 0}</span>
                </div>
                <Link to="/profile">
                  <Avatar className="w-9 h-9 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                    <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden md:inline-flex text-gray-600 hover:text-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  登出
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                    登录
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient">
                    注册
                  </Button>
                </Link>
              </>
            )}
             <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 hover:bg-gray-100">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
       <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white/95 backdrop-blur-lg pb-4"
          >
            <nav className="flex flex-col items-center space-y-4 pt-2">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} className="text-gray-600 hover:text-blue-600 transition-colors text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
               {user && (
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                    }}
                    className="text-red-500 hover:text-red-600 text-lg"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    登出
                  </Button>
               )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navigation;
