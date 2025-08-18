import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const WechatIcon = () => (
  <svg viewBox="0 0 1024 1024" width="1.5em" height="1.5em" fill="currentColor" className="text-green-500">
    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm218.2 597.3c-11.4 0-22.5-1.7-33.2-5.3-11.2-3.7-21.4-9.2-30.6-16.5-9.2-7.3-17.2-16.3-24-26.8-6.8-10.5-12.2-22.3-16.3-35.2-16.8 11.4-35.2 20.6-55.3 27.6-20.1 7-41.4 10.5-63.8 10.5-84.2 0-159.2-31.1-225.2-93.3-66-62.2-99-140.3-99-234.4s33-172.2 99-234.4c66-62.2 141-93.3 225.2-93.3 84.2 0 159.2 31.1 225.2 93.3 66 62.2 99 140.3 99 234.4 0 22.5-3.5 44.1-10.5 64.7-7 20.6-16.2 39.6-27.6 56.9 13.3 4.1 25.4 9.6 36.3 16.3 10.9 6.8 20.4 14.9 28.5 24.4 8.1 9.6 14.7 20.4 19.8 32.4 5.1 12 7.6 24.8 7.6 38.4 0 11.4-1.7 22.5-5.3 33.2-3.6 10.7-9.1 20.6-16.3 29.6-7.2 9.1-16.2 16.8-26.8 23.2-10.6 6.4-22.4 11.4-35.2 14.9s-26.4 5.3-40.6 5.3zM325.4 421.1c-25.8 0-46.8 21-46.8 46.8s21 46.8 46.8 46.8 46.8-21 46.8-46.8-21-46.8-46.8-46.8zm268.8 0c-25.8 0-46.8 21-46.8 46.8s21 46.8 46.8 46.8 46.8-21 46.8-46.8-21-46.8-46.8-46.8z" />
  </svg>
);

const QQIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1.5em" height="1.5em" fill="currentColor" className="text-blue-500">
        <path d="M824.8 613.2c-16-86.2-39.2-165.2-69.6-237.2-32.8-76.8-73.6-142.8-122.4-198-48.8-55.2-104.4-98.4-166.8-129.6-57.6-28.8-112.4-43.2-164.4-43.2-49.6 0-92.8 12.8-129.6 38.4-36.8 25.6-64.4 62-82.8 109.2-18.4 47.2-27.6 103.2-27.6 168 0 79.2 17.2 151.2 51.6 216 34.4 64.8 82.4 119.2 144 163.2 61.6 44 130.4 76.4 206.4 97.2 76 20.8 149.2 31.2 220 31.2 44.8 0 88-4.8 130-14.4 42-9.6 80.8-24.4 116.4-44.4 35.6-20 63.6-43.6 84-70.8 20.4-27.2 30.8-55.6 31.2-85.2 0.4-32-8.8-66.4-27.2-103.2zM340.4 563.6c-34.4-4-66.4-14.4-96-31.2-29.6-16.8-54.4-39.6-74.4-68.4-20-28.8-30-60.8-30-96s10-67.2 30-96c20-28.8 44.8-51.6 74.4-68.4 29.6-16.8 61.6-27.2 96-31.2 34.4-4 67.6-6 100-6 32.4 0 64.4 2 96 6 31.6 4 61.6 14.4 89.6 31.2 28 16.8 50.4 39.6 67.2 68.4 16.8 28.8 25.2 60.8 25.2 96s-8.4 67.2-25.2 96c-16.8 28.8-39.2 51.6-67.2 68.4-28 16.8-58 27.2-89.6 31.2-31.6 4-63.6 6-96 6-32.4 0-65.6-2-100-6z" />
    </svg>
);

const SharePopover = ({ post, children }) => {
  const postUrl = `${window.location.origin}/social#post-${post.id}`;
  const postTitle = `来自 SocialSphere 的分享: ${post.author.username}`;
  const postSummary = post.content.substring(0, 100) + '...';
  const postImage = post.image_urls?.[0] || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    toast({ title: '链接已复制到剪贴板！' });
  };

  const handleShareToQQ = () => {
    const qqShareUrl = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}&summary=${encodeURIComponent(postSummary)}&pics=${encodeURIComponent(postImage)}`;
    window.open(qqShareUrl, '_blank');
  };

  const handleShareToWechat = () => {
    toast({
      title: '微信分享',
      description: '请截图或复制链接后，在微信中打开并分享。',
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleShareToWechat} className="flex flex-col h-auto p-2 space-y-1">
            <WechatIcon />
            <span className="text-xs">微信</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShareToQQ} className="flex flex-col h-auto p-2 space-y-1">
            <QQIcon />
            <span className="text-xs">QQ</span>
          </Button>
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