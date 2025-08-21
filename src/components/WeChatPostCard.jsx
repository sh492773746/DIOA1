import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, Trash2, MoreVertical, Edit, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import PostComments from '@/components/PostComments';
import ImageLightbox from '@/components/ImageLightbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SharePopover from '@/components/SharePopover';
import EditPostDialog from '@/components/EditPostDialog';

const WeChatPostCard = ({ post, onPostUpdated, onDeletePost }) => {
  const { user, profile } = useAuth();
  const [hasLiked, setHasLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(post.likes_count || 0);
  const [showComments, setShowComments] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isExpandable, setIsExpandable] = React.useState(false);
  const [comments, setComments] = React.useState(post.comments || []);
  const contentRef = React.useRef(null);

  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentLightboxImage, setCurrentLightboxImage] = React.useState(null);

  const isAdmin = profile?.role === 'admin';
  const isAuthor = user?.id === post.user_id;

  const authorUsername = post.author?.username || '已注销用户';
  const authorAvatarUrl = post.author?.avatar_url;
  const authorProfileId = post.author?.id;

  const checkExpandable = React.useCallback(() => {
    if (contentRef.current) {
      setIsExpandable(contentRef.current.scrollHeight > contentRef.current.clientHeight + 1);
    }
  }, []);

  React.useLayoutEffect(() => {
    checkExpandable();
    const handleResize = () => checkExpandable();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkExpandable, post.content]);

  React.useEffect(() => {
    if (user && post.likes) {
        setHasLiked(post.likes.some(like => like.user_id === user.id));
    }
  }, [post.likes, user]);

  const handleLike = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "请先登录", description: "登录后才能点赞哦！" });
      return;
    }

    const newLikedState = !hasLiked;
    setHasLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    if (newLikedState) {
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
        if (error) {
            toast({ title: '点赞失败', variant: 'destructive' });
            setHasLiked(!newLikedState);
            setLikesCount(prev => prev - 1);
        } else {
             onPostUpdated({ ...post, likes_count: likesCount + 1, likes: [...post.likes, { user_id: user.id, author: profile }] });
        }
    } else {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        if (error) {
            toast({ title: '取消点赞失败', variant: 'destructive' });
            setHasLiked(!newLikedState);
            setLikesCount(prev => prev + 1);
        } else {
            onPostUpdated({ ...post, likes_count: likesCount - 1, likes: post.likes.filter(l => l.user_id !== user.id) });
        }
    }
  };

  const handleToggleComments = () => setShowComments(prev => !prev);
  
  const handleDeletePost = async () => {
    try {
      const { error } = await supabase.rpc('delete_post_and_images', { post_id_to_delete: post.id });
      if (error) throw error;
      toast({ title: '帖子已删除' });
      onDeletePost(post.id);
    } catch (error) {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleTogglePin = async () => {
    const newPinStatus = !post.is_pinned;
    const { error } = await supabase.from('posts').update({ is_pinned: newPinStatus }).eq('id', post.id);
    if(error){
       toast({ title: newPinStatus ? '置顶失败' : '取消置顶失败', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: newPinStatus ? '帖子已置顶' : '帖子已取消置顶' });
       onPostUpdated({...post, is_pinned: newPinStatus});
    }
  };

  const handleEditClick = () => {
    if (post.edit_count > 0 && !isAdmin) {
      toast({
        title: "编辑次数已用完",
        description: "每个帖子只能编辑一次。",
        variant: "destructive"
      });
    } else {
      setIsEditing(true);
    }
  };

  const handleToggleExpand = () => setIsExpanded(prev => !prev);
  const handleCommentCreated = (newComment) => {
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    onPostUpdated({ ...post, comments: updatedComments });
  };
  const handleCommentDeleted = (commentId) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    onPostUpdated({ ...post, comments: updatedComments });
  };
  
  const openLightbox = (imageUrl) => setCurrentLightboxImage(imageUrl);

  const AuthorAvatar = () => (
    <Avatar className="w-10 h-10 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer">
      <AvatarImage src={authorAvatarUrl} alt={authorUsername} />
      <AvatarFallback>{authorUsername?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
  
  if (!post.author) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p className="text-red-700 text-sm">此动态内容无法显示，作者信息丢失。</p>
        <p className="text-red-500 text-xs mt-1">Post ID: {post.id}</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        id={`post-${post.id}`}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4 md:p-6"
      >
        <div className="flex items-start space-x-3 mb-4">
          {authorProfileId ? (
            <Link to={`/profile/${authorProfileId}`}>
              <AuthorAvatar />
            </Link>
          ) : (
            <AuthorAvatar />
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-2">
                {authorProfileId ? (
                  <Link to={`/profile/${authorProfileId}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
                      {authorUsername}
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-800">{authorUsername}</span>
                )}
                {post.is_pinned && (
                    <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center">
                        <Pin className="w-3 h-3 mr-1"/>已置顶
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500">
              {format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              {post.updated_at > post.created_at && <span className="text-gray-400"> (已编辑)</span>}
            </p>
          </div>
          {(isAuthor || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>编辑</span>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={handleTogglePin}>
                      {post.is_pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                      <span>{post.is_pinned ? '取消置顶' : '置顶'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {(isAuthor || isAdmin) && (
                  <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>删除</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mb-4">
          <div 
            ref={contentRef} 
            className={`text-gray-800 whitespace-pre-wrap transition-all duration-300 ${!isExpanded ? 'line-clamp-6' : ''}`}
          >
            {post.content}
          </div>
          {isExpandable && !isExpanded && (
            <Button variant="link" onClick={handleToggleExpand} className="px-0 text-blue-600 hover:no-underline">
              全文
            </Button>
          )}
        </div>

        {post.image_urls && post.image_urls.length > 0 && (
          <div className={`grid grid-cols-3 gap-2 mb-4`}>
            {post.image_urls.map((imageUrl, index) => (
              <div key={imageUrl || index} onClick={() => openLightbox(imageUrl)} className="aspect-square">
                <motion.img
                  src={imageUrl} alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
                  layoutId={`post-image-${post.id}-${index}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-gray-500 text-sm border-t border-b border-gray-100 py-2">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLike} className={`flex items-center space-x-1 ${hasLiked ? 'text-blue-600' : ''}`}>
              <ThumbsUp className="w-4 h-4" />
              <span>{likesCount} 赞</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToggleComments} className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length || 0} 评论</span>
            </Button>
          </div>
          <SharePopover post={post}>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </Button>
          </SharePopover>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
              <PostComments postId={post.id} initialComments={comments} onCommentCreated={handleCommentCreated} onCommentDeleted={handleCommentDeleted} isWeChatStyle={true}/>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <EditPostDialog isOpen={isEditing} setIsOpen={setIsEditing} post={post} onPostUpdated={onPostUpdated} />
      <ImageLightbox isOpen={!!currentLightboxImage} onOpenChange={() => setCurrentLightboxImage(null)} imageUrl={currentLightboxImage} />

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此帖子吗?</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。这将永久删除您的帖子及其所有相关数据。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className={buttonVariants({ variant: "destructive" })}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WeChatPostCard;