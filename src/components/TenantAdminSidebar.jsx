
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutTemplate, ArrowLeft, Brush } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const TenantAdminSidebar = ({ onLinkClick }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const navItems = [
    { to: '/tenant-admin/page-content', icon: LayoutTemplate, label: '页面内容管理' },
    { to: '/tenant-admin/site-settings', icon: Brush, label: '站点设置' },
  ];

  const handleNavLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 hidden md:block">
        <h2 className="text-xl font-bold text-gray-800">分站管理后台</h2>
        <span className="text-sm text-gray-500">专属您的运营中心</span>
      </div>
       <div className="p-4 border-b border-gray-200 md:hidden">
        <h2 className="text-xl font-bold text-gray-800">菜单</h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-4 py-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/tenant-admin/dashboard'}
              onClick={handleNavLinkClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-gray-200">
         <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{profile?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold text-sm text-gray-800">{profile?.username}</p>
                <p className="text-xs text-gray-500">分站管理员</p>
            </div>
        </div>
        <Button onClick={() => navigate('/')} variant="outline" className="w-full mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回应用
        </Button>
        <Button onClick={signOut} variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          登出
        </Button>
      </div>
    </aside>
  );
};

export default TenantAdminSidebar;
