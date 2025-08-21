
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Image, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchWithRetry } from '@/lib/api';

const POST_MAX_LENGTH = 300;

const CreatePost = ({ isOpen, setIsOpen, onPostCreated, tenantId }) => {
    const { user, profile, refreshProfile } = useAuth();
    const [content, setContent] = useState('');
    const [isAd, setIsAd] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [costs, setCosts] = useState({ social: 100, ad: 100 });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchCosts = async () => {
            let query = supabase.from('app_settings').select('key, value');
            let tenantQuery = supabase.from('app_settings').select('key, value');

            if (tenantId) {
                tenantQuery = tenantQuery.eq('tenant_id', tenantId);
            }
            const globalQuery = query.is('tenant_id', null);

            const [tenantData, globalData] = await Promise.all([
                fetchWithRetry(() => tenantQuery.in('key', ['social_post_cost', 'ad_post_cost'])),
                fetchWithRetry(() => globalQuery.in('key', ['social_post_cost', 'ad_post_cost'])),
            ]);

            const tenantSettings = tenantData.data?.reduce((acc, { key, value }) => {
                acc[key] = parseInt(value, 10);
                return acc;
            }, {}) || {};
            
            const globalSettings = globalData.data?.reduce((acc, { key, value }) => {
                acc[key] = parseInt(value, 10);
                return acc;
            }, {}) || {};

            setCosts({
                social: tenantSettings.social_post_cost ?? globalSettings.social_post_cost ?? 100,
                ad: tenantSettings.ad_post_cost ?? globalSettings.ad_post_cost ?? 100,
            });
        };
        if(isOpen) fetchCosts();
    }, [isOpen, tenantId]);


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
        if (imageFiles.length + files.length > 9) {
            toast({ title: "图片数量超出限制", description: "最多只能上传 9 张图片。", variant: "destructive" });
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: `图片 "${file.name}" 太大`, description: "请选择小于 5MB 的图片。", variant: "destructive" });
                return false;
            }
            return true;
        });

        setImageFiles(prev => [...prev, ...validFiles]);
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };

    const resetForm = () => {
        setContent('');
        setIsAd(false);
        setImageFiles([]);
        setImagePreviews([]);
    };

    const handleSubmit = async () => {
        if (!content.trim() && imageFiles.length === 0) {
            toast({ title: "内容不能为空", description: "请输入一些文字或添加图片。", variant: "destructive" });
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
                    return supabase.storage.from('post-images').upload(filePath, file);
                });
                const uploadResults = await Promise.all(uploadPromises);
                
                const uploadErrors = uploadResults.filter(result => result.error);
                if (uploadErrors.length > 0) throw new Error(`图片上传失败: ${uploadErrors.map(e => e.error.message).join(', ')}`);
                
                uploadedImageUrls = uploadResults.map(result => supabase.storage.from('post-images').getPublicUrl(result.data.path).data.publicUrl);
            }

            const { data, error } = await supabase.rpc('create_post_and_deduct_points', {
                p_user_id: user.id,
                p_content: content.trim(),
                p_is_ad: isAd,
                p_image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
                p_tenant_id: tenantId
            });

            if (error) throw error;
            
            const newPostData = data[0];
            const enrichedPost = {
                ...newPostData,
                author: profile,
                likes: [],
                comments: [],
                likes_count: 0
            };
            onPostCreated(enrichedPost);

            toast({ title: "🎉 发布成功！", description: `你的动态正在审核中。消耗了 ${getPostCost()} 积分。` });
            setIsOpen(false);
            resetForm();
            await refreshProfile();
            
        } catch (error) {
            toast({ title: "❌ 发布失败", description: error.message, variant: "destructive" });
            
            if (uploadedImageUrls.length > 0) {
                 const filePaths = uploadedImageUrls.map(url => url.substring(url.indexOf(`${user.id}/`)));
                 await supabase.storage.from('post-images').remove(filePaths);
            }
        } finally {
            setIsPosting(false);
        }
    };

    const getPostCost = () => {
        if (isAd) {
            return profile?.free_ads_count > 0 ? 0 : costs.ad;
        }
        return costs.social;
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
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
                        className="min-h-[100px] bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 resize-none"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                        {content.length} / {POST_MAX_LENGTH}
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                    <img src={src} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                                    <Button
                                        type="button" variant="ghost" size="icon"
                                        className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70 hover:text-white h-6 w-6 rounded-full"
                                        onClick={() => removeImage(index)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
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
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current.click()}
                            disabled={imagePreviews.length >= 9}
                        >
                            <Image className="w-4 h-4 mr-2" />
                            添加图片 ({imagePreviews.length}/9)
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="is-ad-switch">发布为白菜</Label>
                          <Switch
                            id="is-ad-switch"
                            checked={isAd}
                            onCheckedChange={setIsAd}
                          />
                        </div>
                    </div>
                     <p className="text-sm text-gray-500 text-center">
                        本次发布将消耗 <span className="font-bold text-blue-600">{getPostCost()}</span> 积分。
                        {isAd && profile?.free_ads_count > 0 && ` (剩余 ${profile.free_ads_count} 次免费机会)`}
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={isPosting} variant="gradient">
                        {isPosting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                发布中...
                            </>
                        ) : '发布'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePost;
