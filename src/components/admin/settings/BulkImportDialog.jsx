import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const BulkImportDialog = ({ isOpen, onOpenChange, json, onJsonChange, onImport }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量导入设置</DialogTitle>
          <DialogDescription>
            在此处粘贴您的JSON配置。只会更新JSON中存在的键。
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={json}
          onChange={(e) => onJsonChange(e.target.value)}
          placeholder='{ "site_name": "我的新网站", "new_user_points": "150" }'
          rows={10}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onImport}>导入</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;