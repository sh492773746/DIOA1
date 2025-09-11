import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase as supabaseClient } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import PostComments from '@/components/PostComments';
import ImageLightbox from '@/components/ImageLightbox';
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
import EditPostDialog from '@/components/EditPostDialog';
import PostHeader from '@/components/wechat-post-card/PostHeader';
import PostContent from '@/components/wechat-post-card/PostContent';
import PostImageGrid from '@/components/wechat-post-card/PostImageGrid';
import PostFooter from '@/components/wechat-post-card/PostFooter';

const WeChatPostCard = ({ post, onPostUpdated, onDeletePost }) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [hasLiked, setHasLiked] = React.useState(post.likes?.some(like => like.user_id === user?.id));
  const [likesCount, setLikesCount] = React.useState(post.likes_count || 0);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState(post.comments || []);
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [currentLightboxImage, setCurrentLightboxImage] = React.useState(null);

  const isAuthor = user && post.author?.id === user.id;

  React.useEffect(() => {
     supabaseClient
      .from('comments')
      .select('*, author:profiles(id, username, avatar_url)')
      .eq('post_id', post.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => setComments(data || []));
  }, [post.id]);

  React.useEffect(() => {
    setHasLiked(post.likes?.some(like => like.user_id === user?.id));
    setLikesCount(post.likes_count || 0);
    setComments(post.comments || []);
  }, [post.likes, post.likes_count, post.comments, user]);

  const handleLike = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "请先登录", description: "登录后才能点赞哦。" });
      return;
    }
    if (post.status !== 'approved') {
        toast({ variant: "destructive", title: "操作无效", description: "帖子审核通过后才能点赞。" });
        return;
    }

    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikesCount(prev => newHasLiked ? prev + 1 : Math.max(0, prev - 1));

    const rpcName = 'likes';
    const method = newHasLiked ? 'insert' : 'delete';
    const match = newHasLiked ? {} : { post_id: post.id, user_id: user.id };
    const body = newHasLiked ? { post_id: post.id, user_id: user.id, tenant_id: post.tenant_id } : undefined;

    const { error } = await supabaseClient.from(rpcName)[method](body).match(match);

    if (error) {
      setHasLiked(!newHasLiked);
      setLikesCount(prev => !newHasLiked ? prev + 1 : Math.max(0, prev - 1));
      toast({ variant: "destructive", title: newHasLiked ? "点赞失败" : "取消点赞失败", description: error.message });
    }
  };
  
  const handleToggleComments = () => {
    if (post.status !== 'approved' && !isAuthor && !isAdmin && !user) {
        toast({ variant: "destructive", title: "操作无效", description: "帖子审核通过后才能评论。" });
        return;
    }
    setShowComments(prev => !prev)
  };
  
  const handleDeletePost = async () => {
    const { error } = await supabaseClient.rpc('delete_post_and_images', { post_id_to_delete: post.id });

    if (error) {
      toast({ variant: "destructive", title: "删除失败", description: error.message });
    } else {
      toast({ title: "删除成功", description: "帖子已删除。" });
      onDeletePost(post.id);
    }
    setIsDeleting(false);
  };
  
  const handleTogglePin = async () => {
    const { data, error } = await supabaseClient
      .from('posts')
      .update({ is_pinned: !post.is_pinned })
      .eq('id', post.id)
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "操作失败", description: error.message });
    } else {
      toast({ title: "操作成功", description: `帖子已${data.is_pinned ? '置顶' : '取消置顶'}` });
      onPostUpdated(data);
    }
  };

  const handleEditClick = () => {
    if (post.edit_count > 0 && !isAdmin) {
      toast({
        title: "编辑次数已用完",
        description: "每个帖子只能编辑一次。",
        variant: "destructive"
      });
      return;
    }
    setIsEditing(true);
  };
  
  const handleCommentCreated = (newComment) => {
    setComments(prev => [newComment, ...prev]);
    onPostUpdated({ ...post, comments: [newComment, ...comments] });
  };
  
  const handleCommentDeleted = (commentId) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    onPostUpdated({ ...post, comments: updatedComments });
  };

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
        <PostHeader post={post} isAuthor={isAuthor} isAdmin={isAdmin} onEdit={handleEditClick} onTogglePin={handleTogglePin} onDelete={() => setIsDeleting(true)} />
        <PostContent content={post.content} />
        {post.image_urls && post.image_urls.length > 0 && (
          <PostImageGrid images={post.image_urls} postId={post.id} onImageClick={setCurrentLightboxImage} />
        )}
        
        {!post.is_ad && (
          <PostFooter post={post} hasLiked={hasLiked} likesCount={likesCount} commentsCount={comments.length} onLike={handleLike} onToggleComments={handleToggleComments} />
        )}

        <AnimatePresence>
          {showComments && !post.is_ad && (
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