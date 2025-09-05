import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Gamepad2, LogOut, Coins, Menu, X, Bell, Sun, Moon } from 'lucide-react';
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
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeProvider';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-muted-foreground hover:text-primary"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};

const Navigation = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut, siteSettings, supabase } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && supabase) {
      const fetchNotifications = async () => {
        const { data, count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        setNotifications(data || []);
        setUnreadCount(count || 0);
      };

      fetchNotifications();
      
      const channel = supabase.channel(`notifications:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
          (payload) => {
            fetchNotifications();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/social', label: '朋友圈' },
    { path: '/games', label: '游戏中心' },
    { path: '/prediction', label: '预测' },
    { path: '/profile', label: '我的' },
  ];

  return (
    <>
    <header className="bg-background/80 backdrop-blur-lg border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center text-2xl font-bold text-foreground">
            {siteSettings.logo_url ? (
              <img src={siteSettings.logo_url} alt={siteSettings.site_name || 'Site Logo'} className="h-8 max-w-[150px] object-contain" />
            ) : (
              siteSettings.site_name || '大海'
            )}
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} className="text-muted-foreground hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-secondary border-border">
                    <DropdownMenuLabel>通知</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-2 cursor-pointer focus:bg-accent">
                          <div>
                             <p className="text-sm">{(notification.content)?.message || '新的通知'}</p>
                             <p className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        没有新通知
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/notifications')} className="justify-center focus:bg-accent">
                        查看全部通知
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden md:flex items-center space-x-2 bg-secondary rounded-full px-3 py-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-foreground">{profile?.points || 0}</span>
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
                  className="hidden md:inline-flex text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  登出
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:bg-accent">
                    登录
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button>
                    注册
                  </Button>
                </Link>
              </>
            )}
             <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-muted-foreground hover:bg-accent">
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
            className="md:hidden bg-background/95 backdrop-blur-lg pb-4"
          >
            <nav className="flex flex-col items-center space-y-4 pt-2">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} className="text-muted-foreground hover:text-primary text-lg" onClick={() => setIsMobileMenuOpen(false)}>
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
                    className="text-destructive hover:text-destructive text-lg"
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
    </>
  );
};

export default Navigation;