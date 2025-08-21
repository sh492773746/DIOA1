import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import BatchImportDialog from '@/components/admin/BatchImportDialog';
import * as LucideIcons from 'lucide-react';

const renderIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4 mr-2 text-gray-500" /> : null;
};

const DesktopContentTable = ({ items, onEdit, onDelete, onToggleActive }) => (
  <table className="w-full text-sm">
    <thead className="text-left text-gray-500 bg-gray-50">
      <tr>
        <th className="p-3 font-normal">内容摘要</th>
        <th className="p-3 font-normal">排序</th>
        <th className="p-3 font-normal">状态</th>
        <th className="p-3 font-normal text-right">操作</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-t">
          <td className="p-3 max-w-xs truncate text-gray-600 flex items-center">
            {item.content.icon && renderIcon(item.content.icon)}
            {item.content.title || item.content.text || item.content.name || JSON.stringify(item.content)}
          </td>
          <td className="p-3 text-gray-600">{item.position}</td>
          <td className="p-3">
            <Switch checked={item.is_active} onCheckedChange={() => onToggleActive(item)} />
          </td>
          <td className="p-3 text-right">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const MobileContentCards = ({ items, onEdit, onDelete, onToggleActive }) => (
  <div className="space-y-3 p-4 bg-gray-50 rounded-b-md">
    {items.map(item => (
      <Card key={item.id} className="bg-white shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-gray-800 truncate flex items-center">
            {item.content.icon && renderIcon(item.content.icon)}
            {item.content.title || item.content.text || item.content.name || JSON.stringify(item.content)}
          </p>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>排序: {item.position}</span>
            <div className="flex items-center space-x-2">
              <span>状态</span>
              <Switch checked={item.is_active} onCheckedChange={() => onToggleActive(item)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 p-2 bg-gray-50 border-t">
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-1" /> 编辑
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4 mr-1" /> 删除
          </Button>
        </CardFooter>
      </Card>
    ))}
  </div>
);

const ContentSection = ({ sectionConfig, sectionContent, onEdit, onDelete, onReorder, onAddNew, onBatchImport }) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const itemCount = Array.isArray(sectionContent) ? sectionContent.length : 0;
    const [isImporting, setIsImporting] = useState(false);

    const handleImportClick = () => {
        setIsImporting(true);
    };

    const handleToggleActive = async (item) => {
        // This is a placeholder. The actual implementation should be in PageContentManager
        console.log("Toggling active state for item:", item.id);
    };

    return (
        <>
            <Card>
                <div className="flex flex-wrap justify-between items-center p-4 border-b gap-2">
                    <div>
                        <h3 className="font-semibold text-lg">{sectionConfig.name}</h3>
                        <p className="text-sm text-gray-500">{sectionConfig.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {sectionConfig.batchImport && (
                            <Button onClick={handleImportClick} size="sm" variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                批量导入
                            </Button>
                        )}
                        <Button onClick={onAddNew} size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            新增
                        </Button>
                    </div>
                </div>
                
                <CardContent className="p-0">
                {itemCount > 0 ? (
                    isDesktop ? 
                    <DesktopContentTable items={sectionContent} onEdit={onEdit} onDelete={onDelete} onToggleActive={handleToggleActive} onReorder={onReorder} /> :
                    <MobileContentCards items={sectionContent} onEdit={onEdit} onDelete={onDelete} onToggleActive={handleToggleActive} onReorder={onReorder} />
                ) : (
                    <div className="text-center p-8">
                        <p className="text-gray-500">此模块下暂无内容项。</p>
                    </div>
                )}
                </CardContent>
            </Card>
            {isImporting && (
                <BatchImportDialog
                    open={isImporting}
                    onOpenChange={setIsImporting}
                    onImport={onBatchImport}
                    page={sectionConfig.pageId}
                    section={sectionConfig.id}
                />
            )}
        </>
    );
};

export default ContentSection;