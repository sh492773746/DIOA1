import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Trash2, Megaphone, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageLightbox from '@/components/ImageLightbox';
import SharePopover from '@/components/SharePopover';

const PostCard = ({ post, onDeletePost }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const contentRef = useRef(null);
  const [currentLightboxImage, setCurrentLightboxImage] = useState(null);

  const checkExpandable = useCallback(() => {
    if (contentRef.current) {
      setIsExpandable(contentRef.current.scrollHeight > contentRef.current.clientHeight + 5);
    }
  }, []);

  useLayoutEffect(() => {
    checkExpandable();
    const handleResize = () => checkExpandable();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkExpandable, post.content]);

  const handleDelete = async () => {
    try {
        const { error } = await supabase.rpc('delete_post_and_images', {
            post_id_to_delete: post.id
        });

        if (error) {
            throw error;
        }

        toast({ title: "删除成功" });
        onDeletePost(post.id);

    } catch (error) {
        toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  }

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const openLightbox = (imageUrl) => {
    setCurrentLightboxImage(imageUrl);
  };

  return (
    <>
      <motion.div
        id={`post-${post.id}`}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border-none card-hover mb-4"
      >
        <Card className="bg-white rounded-lg shadow-sm border-none">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={post.author?.avatar_url} alt={post.author?.username} />
                  <AvatarFallback>{post.author?.username?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-sm text-gray-800">{post.author?.username}</p>
                    {post.is_ad && (
                      <div className="flex items-center text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Megaphone className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">广告</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              {user && user.id === post.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 h-7 w-7 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-3 pt-1 space-y-2">
            <div className="mb-4">
              <div 
                ref={contentRef}
                className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-6 max-h-[30vh] overflow-hidden relative' : ''}`}
                style={{
                  maskImage: !isExpanded && isExpandable ? 'linear-gradient(to bottom, black 80%, transparent 100%)' : 'none',
                  WebkitMaskImage: !isExpanded && isExpandable ? 'linear-gradient(to bottom, black 80%, transparent 100%)' : 'none',
                }}
              >
                {post.content}
              </div>
              {isExpandable && (
                <Button variant="link" onClick={handleToggleExpand} className="px-0 text-blue-600 hover:no-underline">
                  {isExpanded ? '收起' : '全文'}
                </Button>
              )}
            </div>
            
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {post.image_urls.map((imageUrl, index) => (
                  <div key={imageUrl || index} onClick={() => openLightbox(imageUrl)} className="aspect-square">
                    <motion.img
                      src={imageUrl}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
                      layoutId={`post-image-${post.id}-${index}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 pt-0 flex justify-end">
            <SharePopover post={post}>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                <Share2 className="w-4 h-4" />
                <span className="text-xs">分享</span>
              </Button>
            </SharePopover>
          </CardFooter>
        </Card>
      </motion.div>
      <ImageLightbox isOpen={!!currentLightboxImage} onOpenChange={() => setCurrentLightboxImage(null)} imageUrl={currentLightboxImage} />
    </>
  );
};

export default PostCard;