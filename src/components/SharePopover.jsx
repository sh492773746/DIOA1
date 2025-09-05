import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SharePopover = ({ post, children }) => {
  const postUrl = `${window.location.origin}/social#post-${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    toast({ title: '链接已复制到剪贴板！' });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleCopyLink} className="flex flex-col h-auto p-2 space-y-1">
            <Copy className="w-4 h-4" />
            <span className="text-xs">复制链接</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SharePopover;