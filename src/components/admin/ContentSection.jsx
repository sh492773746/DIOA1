import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Upload, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const DesktopContentTable = ({ items, onEdit, onDelete, onToggleActive }) => (
  <table className="w-full text-sm">
    <thead className="text-left text-gray-500 bg-gray-50">
      <tr>
        <th className="p-2 font-normal">内容摘要</th>
        <th className="p-2 font-normal">排序</th>
        <th className="p-2 font-normal">状态</th>
        <th className="p-2 font-normal text-right">操作</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-t">
          <td className="p-3 max-w-xs truncate text-gray-600">
            {item.content.title || item.content.text || JSON.stringify(item.content)}
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
  <div className="space-y-4 p-4 bg-gray-50 rounded-b-md">
    {items.map(item => (
      <Card key={item.id} className="bg-white">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 truncate">{item.content.title || item.content.text || JSON.stringify(item.content)}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm">排序: {item.position}</span>
            <Switch checked={item.is_active} onCheckedChange={() => onToggleActive(item)} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 p-2 bg-gray-50 border-t">
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>编辑</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>删除</Button>
        </CardFooter>
      </Card>
    ))}
  </div>
);

const ContentSection = ({ section, items, isDesktop, onAddNew, onBatchImport, onEdit, onDelete, onToggleActive }) => {
  const itemCount = Array.isArray(items) ? items.length : 0;
  
  return (
    <AccordionItem value={section.id}>
      <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-t-md border-b">
        <AccordionTrigger className="flex-1 p-0 hover:no-underline">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-800">{section.name}</h3>
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-2" />
          </div>
        </AccordionTrigger>
        <div className="flex items-center space-x-2 ml-4">
          {section.batchImport && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onBatchImport(section.id); }}>
              <Upload className="mr-2 h-4 w-4" />批量导入
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAddNew(section.id); }}>
              <PlusCircle className="mr-2 h-4 w-4" />新增
          </Button>
        </div>
      </div>
      <AccordionContent>
        {itemCount > 0 ? (
          isDesktop ? 
            <DesktopContentTable items={items} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} /> :
            <MobileContentCards items={items} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} />
        ) : (
          <p className="text-center text-gray-500 py-6 px-4">此模块下暂无内容项。</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default ContentSection;