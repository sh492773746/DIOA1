import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const POST_MAX_LENGTH = 300;

const EditPostDialog = ({ isOpen, setIsOpen, post, onPostUpdated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (post) {
            setContent(post.content);
            setExistingImageUrls(post.image_urls || []);
            setImageFiles([]);
            setImagePreviews([]);
        }
    }, [post]);

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
        const totalImages = existingImageUrls.length + imageFiles.length + files.length;
        if (totalImages > 9) {
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

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return newPreviews;
        });
    };

    const removeExistingImage = (index) => {
        setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!content.trim() && existingImageUrls.length === 0 && imageFiles.length === 0) {
            toast({ title: "内容不能为空", description: "请输入一些文字或添加图片。", variant: "destructive" });
            return;
        }
        
        setIsSaving(true);
        let uploadedImageUrls = [];
        
        try {
            // 1. Upload new images
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

            const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
            
            // 2. Update post in DB
            const { data: updatedPost, error: postUpdateError } = await supabase
                .from('posts')
                .update({ 
                    content: content.trim(), 
                    image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
                    updated_at: new Date().toISOString(),
                    edit_count: (post.edit_count || 0) + 1
                })
                .eq('id', post.id)
                .select()
                .single();

            if (postUpdateError) throw postUpdateError;

            // 3. Delete removed images from storage
            const imagesToDelete = post.image_urls?.filter(url => !existingImageUrls.includes(url)) || [];
            if (imagesToDelete.length > 0) {
                const filePathsToDelete = imagesToDelete.map(url => url.substring(url.indexOf(`${user.id}/`)));
                await supabase.storage.from('post-images').remove(filePathsToDelete);
            }

            toast({ title: "🎉 保存成功！", description: "你的帖子已更新。" });
            onPostUpdated({ ...post, ...updatedPost });
            setIsOpen(false);
            
        } catch (error) {
            toast({ title: "❌ 保存失败", description: error.message, variant: "destructive" });
            
            // Cleanup uploaded files if db update fails
            if (uploadedImageUrls.length > 0) {
                 const filePaths = uploadedImageUrls.map(url => url.substring(url.indexOf(`${user.id}/`)));
                 await supabase.storage.from('post-images').remove(filePaths);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const allImages = [...existingImageUrls, ...imagePreviews];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>编辑帖子</DialogTitle>
                    <DialogDescription>
                        修改你的帖子内容和图片。点击保存以应用更改。
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

                    {allImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {allImages.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                    <img src={src} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                                    <Button
                                        type="button" variant="ghost" size="icon"
                                        className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70 hover:text-white h-6 w-6 rounded-full"
                                        onClick={() => index < existingImageUrls.length ? removeExistingImage(index) : removeNewImage(index - existingImageUrls.length)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                     <div className="flex items-center">
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
                            disabled={allImages.length >= 9}
                        >
                            <Image className="w-4 h-4 mr-2" />
                            添加图片 ({allImages.length}/9)
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>取消</Button>
                    <Button onClick={handleSave} disabled={isSaving} variant="gradient">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : '保存更改'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPostDialog;