import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Sun, Moon } from 'lucide-react';
import TenantAdminSidebar from '@/components/TenantAdminSidebar';
import { useTheme } from '@/contexts/ThemeProvider';

const TenantAdminLayout = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { siteSettings } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <TenantAdminSidebar />
        </div>
        
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden relative z-10 flex-shrink-0 flex h-16 bg-card border-b border-border">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                  <span className="sr-only">打开菜单</span>
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px]">
                <TenantAdminSidebar onLinkClick={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex-1 px-4 flex justify-between items-center">
               <h2 className="text-lg font-bold text-foreground">{siteSettings.site_name} - 分站管理</h2>
               <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </Button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex flex-shrink-0 bg-card border-b border-border h-16 px-6 items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{siteSettings.site_name} - 分站管理</h2>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>
          </div>

          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children || <Outlet />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TenantAdminLayout;