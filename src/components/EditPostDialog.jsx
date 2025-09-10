import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const POST_MAX_LENGTH = 300;

const EditPostDialog = ({ isOpen, setIsOpen, post, onPostUpdated }) => {
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

    const handleFileSelect = (e) => {
        toast({ title: "功能已禁用", description: "请先集成数据库以启用此功能。", variant: "destructive" });
    };

    const removeNewImage = (index) => {
        // This part is disabled as file upload is disabled
    };

    const removeExistingImage = (index) => {
        setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        toast({ title: "功能已禁用", description: "请先集成数据库以启用此功能。", variant: "destructive" });
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