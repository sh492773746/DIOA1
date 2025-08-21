import React, { useState } from 'react';
import TenantAdminSidebar from '@/components/TenantAdminSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const TenantAdminLayout = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="min-h-screen admin-bg">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <TenantAdminSidebar />
        </div>
        
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden">
                  <span className="sr-only">打开菜单</span>
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px]">
                <TenantAdminSidebar onLinkClick={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex-1 px-4 flex justify-between items-center">
               <h2 className="text-lg font-bold text-gray-800">分站管理后台</h2>
            </div>
          </div>

          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TenantAdminLayout;