import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, X, Link, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            }));
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};


const ImageUploader = ({ initialUrl, onUrlChange, bucketName = 'page-content-images', hint, allowUrl = true, uploaderHeight = "h-48" }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const { toast } = useToast();
  const localUrlRef = useRef(null);

  useEffect(() => {
    setImageUrl(initialUrl || '');
  }, [initialUrl]);

  useEffect(() => {
    return () => {
      if (localUrlRef.current) {
        URL.revokeObjectURL(localUrlRef.current);
      }
    };
  }, []);

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setProgress(0);

    try {
        const compressedFile = await compressImage(file);
        
        const localPreviewUrl = URL.createObjectURL(compressedFile);
        if (localUrlRef.current) {
            URL.revokeObjectURL(localUrlRef.current);
        }
        localUrlRef.current = localPreviewUrl;
        setImageUrl(localPreviewUrl);

        const fileName = `${Date.now()}_${compressedFile.name.split('.')[0]}.jpg`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (error) {
          throw error;
        }

        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        
        if (data.publicUrl) {
          const permanentUrl = data.publicUrl.split('?')[0];
          setImageUrl(permanentUrl);
          onUrlChange(permanentUrl);
          toast({ title: '图片上传成功!' });
          if (localUrlRef.current) {
            URL.revokeObjectURL(localUrlRef.current);
            localUrlRef.current = null;
          }
        } else {
          throw new Error('获取图片链接失败');
        }

    } catch (error) {
        toast({ title: '图片上传失败', description: error.message, variant: 'destructive' });
        setImageUrl(initialUrl || '');
    } finally {
        setUploading(false);
    }
  }, [bucketName, onUrlChange, toast, initialUrl]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleRemoveImage = () => {
    setImageUrl('');
    onUrlChange('');
  };

  const handleUrlSubmit = () => {
      if (urlInput && (urlInput.startsWith('http://') || urlInput.startsWith('https://'))) {
          setImageUrl(urlInput);
          onUrlChange(urlInput);
          toast({ title: '图片链接已设置' });
      } else {
          toast({ title: '链接无效', description: '请输入有效的图片URL', variant: 'destructive' });
      }
  };

  return (
    <div className="space-y-2">
      {imageUrl && !uploading ? (
        <div className={`relative group w-full ${uploaderHeight} border rounded-md overflow-hidden`}>
          <img src={`${imageUrl}?t=${new Date().getTime()}`} alt="Uploaded preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`relative w-full ${uploaderHeight} border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center p-4 transition-colors ${isDragActive ? 'border-primary bg-primary/10' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              {imageUrl.startsWith('blob:') && (
                <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-md opacity-50" />
              )}
              <div className="z-10 flex flex-col items-center justify-center bg-background/70 p-4 rounded-lg">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">正在处理和上传...</p>
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">{isDragActive ? "松开即可上传" : (allowUrl ? "拖拽文件到此处，或点击按钮" : "拖拽文件到此处，或点击按钮")}</p>
              {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
              <div className="flex items-center space-x-2 mt-2">
                 <Button type="button" variant="outline" size="sm" onClick={open}>
                    选择图片
                  </Button>
                  {allowUrl && (
                    <Popover>
                      <PopoverTrigger asChild>
                         <Button type="button" variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><Link className="mr-1 h-4 w-4" /> 使用链接</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" onPointerDownOutside={(e) => e.preventDefault()}>
                          <div className="grid gap-4" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-2">
                                  <h4 className="font-medium leading-none">图片链接</h4>
                                  <p className="text-sm text-muted-foreground">
                                      在此处粘贴图片的URL。
                                  </p>
                              </div>
                              <div className="grid gap-2">
                                 <div className="grid grid-cols-3 items-center gap-4">
                                      <Label htmlFor="url-input">URL</Label>
                                      <Input id="url-input" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="col-span-2 h-8" />
                                 </div>
                                 <Button size="sm" onClick={handleUrlSubmit}>设置</Button>
                              </div>
                          </div>
                      </PopoverContent>
                    </Popover>
                  )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;