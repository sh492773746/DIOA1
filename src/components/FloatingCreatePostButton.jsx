import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CreatePost from '@/components/CreatePost';

const FloatingCreatePostButton = ({ onPostCreated }) => {
  const [open, setOpen] = useState(false);

  const handlePostCreated = (newPost) => {
    onPostCreated(newPost);
    setOpen(false); // Close the sheet after successful post
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <Popover>
          <PopoverTrigger asChild>
            <motion.div
              initial={{ scale: 0, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="fixed bottom-20 right-4 z-50"
            >
              <SheetTrigger asChild>
                <Button variant="gradient" size="icon" className="w-14 h-14 rounded-full shadow-lg">
                  <Plus className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent side="left" className="mr-2 text-sm text-center">
            <p>这里可以发朋友圈和白菜哦</p>
          </PopoverContent>
        </Popover>

        <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] overflow-y-auto">
          <CreatePost onPostCreated={handlePostCreated} isSheet={true} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FloatingCreatePostButton;