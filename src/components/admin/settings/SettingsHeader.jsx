import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SettingsHeader = ({ title, subtitle, isManagingSubTenant, onBack, showActions, onBulkImportClick, onExportClick }) => {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-4">
          {isManagingSubTenant && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </motion.div>

      {isManagingSubTenant && (
        <Alert className="mb-6 border-blue-500 text-blue-800 bg-blue-50">
          <Info className="h-4 w-4 !text-blue-800" />
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>
            您正在为分站进行编辑。未自定义的设置项将自动使用主站的默认配置。点击“自定义”即可为分站创建独立设置。
          </AlertDescription>
        </Alert>
      )}

      <CardHeader className="flex flex-row justify-between items-center px-0">
          <div>
              <CardTitle>设置项</CardTitle>
              <CardDescription>修改后请务必点击下方的保存按钮。</CardDescription>
          </div>
          {showActions && (
            <div className="flex gap-2">
                <Button onClick={onBulkImportClick} variant="outline" size="sm">
                    批量导入
                </Button>
                <Button onClick={onExportClick} variant="outline" size="sm">
                    导出自定义
                </Button>
            </div>
          )}
      </CardHeader>
    </>
  );
};

export default SettingsHeader;