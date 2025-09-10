import React from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import SharePopover from '@/components/SharePopover';

const PostFooter = ({ post, hasLiked, likesCount, commentsCount, onLike, onToggleComments }) => {
  if (post.is_ad) {
    return null;
  }

  return (
    <div className="flex justify-between items-center text-gray-500 text-sm border-t border-b border-gray-100 py-2">
      <div className="flex space-x-4">
        <Button variant="ghost" size="sm" onClick={onLike} className={`flex items-center space-x-1 ${hasLiked ? 'text-blue-600' : ''}`}>
          <ThumbsUp className="w-4 h-4" />
          <span>{likesCount} 赞</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleComments} className="flex items-center space-x-1">
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount || 0} 评论</span>
        </Button>
      </div>
      <SharePopover post={post}>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
          <Share2 className="w-4 h-4" />
          <span>分享</span>
        </Button>
      </SharePopover>
    </div>
  );
};

export default PostFooter;