import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, X, Link } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

const ImageUploader = ({ initialUrl, onUrlChange, bucketName = 'page-content-images', hint, allowUrl = true, uploaderHeight = "h-48" }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setImageUrl(initialUrl || '');
  }, [initialUrl]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setUploading(false);

    if (error) {
      toast({ title: '图片上传失败', description: error.message, variant: 'destructive' });
      return;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (data.publicUrl) {
      const urlWithTimestamp = `${data.publicUrl}?t=${new Date().getTime()}`;
      setImageUrl(urlWithTimestamp);
      onUrlChange(urlWithTimestamp);
      toast({ title: '图片上传成功!' });
    } else {
      toast({ title: '获取图片链接失败', variant: 'destructive' });
    }
  };

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
      {imageUrl ? (
        <div className={`relative group w-full ${uploaderHeight} border rounded-md overflow-hidden`}>
          <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
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
        <div className={`w-full ${uploaderHeight} border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center p-4`}>
          {uploading ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">正在上传...</p>
              <Progress value={progress} className="w-full" />
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">{allowUrl ? "拖拽或点击上传，或使用链接" : "拖拽或点击上传"}</p>
              {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
              <div className="flex items-center space-x-2 mt-2">
                 <Button asChild type="button" variant="outline" size="sm">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      选择图片
                      <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </Button>
                  {allowUrl && (
                    <Popover>
                      <PopoverTrigger asChild>
                         <Button type="button" variant="outline" size="sm"><Link className="mr-1 h-4 w-4" /> 使用链接</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                          <div className="grid gap-4">
                              <div className="space-y-2">
                                  <h4 className="font-medium leading-none">图片链接</h4>
                                  <p className="text-sm text-muted-foreground">
                                      在此处粘贴图片的URL。
                                  </p>
                              </div>
                              <div className="grid gap-2">
                                 <div className="grid grid-cols-3 items-center gap-4">
                                      <Label htmlFor="url">URL</Label>
                                      <Input id="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="col-span-2 h-8" />
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