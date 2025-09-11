import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Image, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Progress } from '@/components/ui/progress';

const POST_MAX_LENGTH = 300;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_COUNT = 9;

const CreatePost = ({ isOpen, setIsOpen, onPostCreated, tenantId }) => {
    const { supabase, user, profile, siteSettings, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [isAd, setIsAd] = useState(false);
    const [useFreePost, setUseFreePost] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});

    const costs = {
      social: parseInt(siteSettings?.social_post_cost || '100', 10),
      ad: parseInt(siteSettings?.ad_post_cost || '200', 10),
    };
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const currentTotal = imageFiles.length + files.length;
        
        if (currentTotal > MAX_IMAGE_COUNT) {
            toast({
                variant: 'destructive',
                title: '图片数量超出限制',
                description: `最多只能上传 ${MAX_IMAGE_COUNT} 张图片。`
            });
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: `图片太大: ${file.name}`,
                    description: `单张图片不能超过 ${MAX_IMAGE_SIZE_MB}MB。`
                });
                return false;
            }
            return true;
        });

        setImageFiles(prev => [...prev, ...validFiles]);
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newImageFiles = [...imageFiles];
        const newImagePreviews = [...imagePreviews];
        newImageFiles.splice(index, 1);
        newImagePreviews.splice(index, 1);
        setImageFiles(newImageFiles);
        setImagePreviews(newImagePreviews);
    };

    const resetForm = () => {
        setContent('');
        setIsAd(false);
        setUseFreePost(true);
        setIsPosting(false);
        setImageFiles([]);
        setImagePreviews([]);
        setUploadProgress({});
    };

    const uploadImages = async () => {
        const uploadedUrls = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const fileName = `${user.id}/${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('post-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

             if (error) {
                throw new Error(`图片上传失败: ${error.message}`);
            }

            const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(data.path);
            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };


    const handleSubmit = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "请先登录" });
            return;
        }
        if (!content.trim() && imageFiles.length === 0) {
            toast({ variant: "destructive", title: "内容不能为空", description: "请写点什么或上传图片。" });
            return;
        }
        if (content.length > POST_MAX_LENGTH) {
            toast({ variant: "destructive", title: "内容太长", description: `帖子内容不能超过 ${POST_MAX_LENGTH} 个字符。` });
            return;
        }
        
        setIsPosting(true);

        try {
            const imageUrls = imageFiles.length > 0 ? await uploadImages() : [];

            const params = {
                p_user_id: user.id,
                p_content: content.trim(),
                p_is_ad: isAd,
                p_image_urls: imageUrls,
                p_tenant_id: tenantId,
                p_use_free_post: canUseFreePost() && useFreePost
            };

            const { data, error } = await supabase.rpc('create_post_and_deduct_points', params);
            
            if (error) {
                throw new Error(error.message);
            }

            toast({ title: "发布成功！", description: "您的帖子已发布。" });
            onPostCreated(data[0]);
            refreshProfile();
            setIsOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "发布失败",
                description: error.message || "发生未知错误，请稍后重试。"
            });
        } finally {
            setIsPosting(false);
        }
    };
    
    const canUseFreePost = () => profile?.free_posts_count > 0;

    const getPostCost = useCallback(() => {
        if (canUseFreePost() && useFreePost) {
            return {
                amount: 0,
                text: "使用 1 次免费额度",
                isFree: true
            };
        }
        const amount = isAd ? costs.ad : costs.social;
        return {
            amount,
            text: `消耗 ${amount} 积分`,
            isFree: false
        };
    }, [isAd, useFreePost, profile?.free_posts_count, costs]);

    const finalCost = getPostCost();
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>创建新帖子</DialogTitle>
                    <DialogDescription>
                        分享你的想法，图片，或发布一条广告。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="有什么新鲜事想分享吗？"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={POST_MAX_LENGTH}
                        className="min-h-[100px] bg-background text-foreground placeholder:text-muted-foreground resize-none"
                        disabled={isPosting}
                    />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                        {content.length} / {POST_MAX_LENGTH}
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                    <img src={src} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                                    {isPosting && uploadProgress[index] !== undefined && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Progress value={uploadProgress[index]} className="w-10/12 h-2" />
                                        </div>
                                    )}
                                    {!isPosting && <Button
                                        type="button" variant="ghost" size="icon"
                                        className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70 hover:text-white h-6 w-6 rounded-full"
                                        onClick={() => removeImage(index)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>}
                                </div>
                            ))}
                        </div>
                    )}
                     <div className="flex items-center justify-between">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/png, image/jpeg, image/gif"
                            className="hidden"
                            multiple
                            disabled={isPosting}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isPosting || imagePreviews.length >= MAX_IMAGE_COUNT}
                        >
                            <Image className="w-4 h-4 mr-2" />
                            添加图片 ({imagePreviews.length}/{MAX_IMAGE_COUNT})
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="is-ad-switch">{isAd ? "白菜区" : "朋友圈"}</Label>
                          <Switch
                            id="is-ad-switch"
                            checked={isAd}
                            onCheckedChange={setIsAd}
                            disabled={isPosting}
                          />
                        </div>
                    </div>
                     {canUseFreePost() && (
                        <div className="flex items-center space-x-2 bg-primary/10 p-2 rounded-md">
                            <Checkbox
                                id="use-free-post"
                                checked={useFreePost}
                                onCheckedChange={setUseFreePost}
                                disabled={isPosting}
                            />
                            <Label htmlFor="use-free-post" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                使用免费发布次数 (剩余 {profile?.free_posts_count || 0} 次)
                            </Label>
                        </div>
                     )}
                     <p className="text-sm text-muted-foreground text-center">
                        本次发布: <span className="font-bold text-primary">{finalCost.text}</span>
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isPosting}>取消</Button>
                    <Button onClick={handleSubmit} disabled={isPosting || (!content.trim() && imageFiles.length === 0)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isPosting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                发布中...
                            </>
                        ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              发布
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePost;