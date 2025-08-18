
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Send, Megaphone, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { fetchWithRetry } from '@/lib/api';

const POST_COST = 5;
const AD_COST = 50;
const POST_MAX_LENGTH = 300;

const CreatePost = ({ onPostCreated, isSheet = false }) => {
  const { user, profile, updateProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isAd, setIsAd] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (imageFiles.length + files.length > 9) {
        toast({
          title: "图片数量超出限制",
          description: "最多只能上传 9 张图片。",
          variant: "destructive",
        });
        return;
      }

      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit per image
          toast({
            title: `图片 "${file.name}" 太大`,
            description: "请选择小于 5MB 的图片。",
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      setImageFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const resetForm = () => {
    setContent('');
    setIsAd(false);
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImageFiles([]);
    setImagePreviews([]);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!content.trim() && imageFiles.length === 0) || !user || !profile) return;

    let costToDeduct = cost;
    
    if (profile.points < costToDeduct) {
       toast({
          title: "❌ 无法发布",
          description: `积分不足。需要 ${costToDeduct} 积分。`,
          variant: 'destructive'
        });
        return;
    }

    setIsPosting(true);
    let uploadedImageUrls = [];

    try {
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => {
          const fileExtension = file.name.split('.').pop();
          const fileName = `${generateRandomString(10)}.${fileExtension}`;
          const filePath = `${user.id}/${fileName}`;
          return fetchWithRetry(() => supabase.storage.from('post-images').upload(filePath, file));
        });

        const uploadResults = await Promise.all(uploadPromises);
        
        const uploadErrors = uploadResults.filter(result => result.error);
        if (uploadErrors.length > 0) {
          throw new Error(`图片上传失败: ${uploadErrors.map(e => e.error.message).join(', ')}`);
        }

        uploadedImageUrls = uploadResults.map(result => {
           return supabase.storage.from('post-images').getPublicUrl(result.data.path).data.publicUrl;
        });
      }

      const { data: insertedPost, error } = await fetchWithRetry(() => supabase.rpc('create_post_and_deduct_points', {
        p_user_id: user.id,
        p_content: content.trim(),
        p_is_ad: isAd,
        p_image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null
      }));

      if (error) throw error;
      
      const { data: fullPost, error: fetchError } = await fetchWithRetry(() => supabase
        .from('posts')
        .select(`*, author:profiles(*), likes(user_id), comments(*, author:profiles(*)), likes_count:likes(count)`)
        .eq('id', insertedPost[0].id)
        .single());
      
      if(fetchError) throw fetchError;

      const enrichedPostData = {
          ...fullPost,
          likes_count: fullPost.likes_count[0] ? fullPost.likes_count[0].count : 0,
      };
      
      const reasonText = isAd ? '发布广告' : '发布动态';
      
      await updateProfile({ points: profile.points - costToDeduct });

      onPostCreated?.(enrichedPostData);
      resetForm();
      
      toast({ title: "🎉 发布成功！", description: `${reasonText}成功，消耗 ${costToDeduct} 积分。` });

    } catch (error) {
      toast({
        title: "❌ 发布失败",
        description: error.message,
        variant: 'destructive'
      });
      
      if(uploadedImageUrls.length > 0){
        const filePaths = uploadedImageUrls.map(url => url.substring(url.indexOf(`/post-images/${user.id}`)+13));
        await supabase.storage.from('post-images').remove(filePaths);
      }
    } finally {
      setIsPosting(false);
    }
  };
  
  const [cost, setCost] = useState(0);

  useEffect(() => {
    const fetchCost = async () => {
        const key = isAd ? 'ad_post_cost' : 'social_post_cost';
        const fallback = isAd ? AD_COST : POST_COST;
        
        const { data, error } = await fetchWithRetry(() => supabase.from('app_settings').select('value').eq('key', key));
        
        if (error || !data || data.length === 0) {
            setCost(fallback);
        } else {
            setCost(parseInt(data[0].value, 10));
        }
    };
    fetchCost();
  }, [isAd]);

  const costText = `消耗 ${cost} 积分`;

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
          <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="有什么新鲜事想分享吗？"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={POST_MAX_LENGTH}
            className="min-h-[120px] bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 resize-none text-sm p-3"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {content.length} / {POST_MAX_LENGTH}
          </div>
        </div>
      </div>

      {imagePreviews.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
              <img src={preview} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70 hover:text-white h-6 w-6 rounded-full"
                  onClick={() => removeImage(index)}
              >
                  <XCircle className="h-4 w-4" />
              </Button>
              </div>
          ))}
          </div>
      )}
      
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
            multiple
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current.click()}
            className="text-gray-500 hover:text-gray-700"
            disabled={imageFiles.length >= 9}
          >
            <Image className="w-5 h-5 mr-2" />
            <span className="text-sm">图片 ({imageFiles.length}/9)</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Checkbox id="isAd" checked={isAd} onCheckedChange={setIsAd} />
            <Label htmlFor="isAd" className="text-sm text-gray-600 flex items-center">
              <Megaphone className="w-4 h-4 mr-1 text-orange-500"/>
              作为广告发布
            </Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <p className="text-sm text-gray-500">{costText}</p>
          <Button
              type="submit"
              disabled={(!content.trim() && imageFiles.length === 0) || isPosting}
              variant="gradient"
              size="sm"
          >
              {isPosting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
              <Send className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">{isPosting ? '发布中' : '发布'}</span>
          </Button>
        </div>
      </div>
    </form>
  );

  if (isSheet) {
    return <div className="p-1"><FormContent /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white rounded-lg shadow-sm border-none">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-gray-800 text-base">分享你的想法</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <FormContent />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreatePost;
