import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { pageConfig } from '@/config/pageContentConfig';

const BatchImportDialog = ({ open, onOpenChange, onImport, page, section }) => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImportClick = async () => {
    if (!file) {
      toast({ title: "请选择一个文件", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await onImport(data);
    } catch (error) {
      toast({ title: "导入失败", description: `文件格式错误或内容不合法: ${error.message}`, variant: "destructive" });
    } finally {
      setIsImporting(false);
      onOpenChange(false);
      setFile(null);
    }
  };

  const downloadTemplate = () => {
    const sectionConfig = pageConfig[page]?.sections.find(s => s.id === section);
    if (!sectionConfig) return;

    const templateObject = {};
    sectionConfig.fields.forEach(field => {
      templateObject[field.id] = `示例${field.label}`;
    });

    const template = JSON.stringify([templateObject], null, 2);
    const blob = new Blob([template], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page}_${section}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const sectionName = pageConfig[page]?.sections.find(s => s.id === section)?.name;
  const pageName = pageConfig[page]?.name;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>批量导入: {pageName} - {sectionName}</AlertDialogTitle>
          <AlertDialogDescription>
            请上传JSON格式的文件进行批量导入。文件内容应为一个包含多个对象的数组。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="json-file">选择JSON文件</Label>
            <Input id="json-file" type="file" accept=".json" onChange={handleFileChange} />
          </div>
          <Button variant="link" onClick={downloadTemplate} className="p-0 h-auto">下载模板</Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleImportClick} disabled={!file || isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认导入
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BatchImportDialog;