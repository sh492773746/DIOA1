import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ initialUrl, onUrlChange, bucketName = 'page-content-images', hint }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setImageUrl(initialUrl);
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

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative group w-full h-48 border rounded-md overflow-hidden">
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
        <div className="w-full h-48 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center p-4">
          {uploading ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">正在上传...</p>
              <Progress value={progress} className="w-full" />
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">拖拽文件到这里或点击上传</p>
              {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
              <Button asChild type="button" variant="outline" size="sm">
                <label htmlFor="file-upload" className="cursor-pointer">
                  选择图片
                  <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;