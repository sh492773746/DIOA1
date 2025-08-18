import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { pageConfig } from '@/config/pageContentConfig';
import ImageUploader from '@/components/ImageUploader';
import IconPicker from '@/components/admin/IconPicker';

const ContentItemForm = ({ item, onSave, onCancel, activePage, activeSection, options }) => {
  const [formData, setFormData] = useState({
    page: activePage || 'home',
    section: '',
    content: {},
    position: 0,
    is_active: true,
  });
  const [formKey, setFormKey] = useState(Date.now());

  const currentSections = pageConfig[activePage]?.sections || [];

  useEffect(() => {
    if (item) {
      setFormData({
        page: item.page,
        section: item.section,
        content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
        position: item.position || 0,
        is_active: item.is_active,
      });
    } else {
      setFormData({
        page: activePage,
        section: activeSection || currentSections[0]?.id || '',
        content: {},
        position: 0,
        is_active: true,
      });
    }
    setFormKey(Date.now());
  }, [item, activePage, activeSection, currentSections]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleContentChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [name]: value,
      },
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value, content: {} }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: item?.id });
  };
  
  const renderContentFields = () => {
    const sectionConfig = currentSections.find(s => s.id === formData.section);
    if (!sectionConfig) return null;

    return sectionConfig.fields.map(field => {
      if (field.type === 'hidden') return null;

      return (
       <div key={field.id} className="space-y-2">
         <Label htmlFor={field.id}>{field.label}</Label>
         {field.type === 'icon' ? (
            <IconPicker
              value={formData.content[field.id] || ''}
              onChange={(iconName) => handleContentChange(field.id, iconName)}
            />
         ) : field.type === 'image' ? (
           <ImageUploader 
             key={`${field.id}-${formKey}`}
             initialUrl={formData.content[field.id] || ''}
             onUrlChange={(url) => handleContentChange(field.id, url)}
             hint={field.hint}
           />
         ) : field.type === 'textarea' ? (
           <Textarea id={field.id} name={field.id} value={formData.content[field.id] || ''} onChange={(e) => handleContentChange(e.target.name, e.target.value)} />
         ) : field.type === 'select' && field.optionsSource ? (
            <Select onValueChange={(val) => handleContentChange(field.id, val)} value={formData.content[field.id]}>
              <SelectTrigger>
                <SelectValue placeholder={`选择${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {(options?.[field.optionsSource] || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
         ) : (
           <Input id={field.id} name={field.id} type={field.type || 'text'} value={formData.content[field.id] || ''} onChange={(e) => handleContentChange(e.target.name, e.target.value)} />
         )}
       </div>
      );
    });
  };

  const isSectionSelectDisabled = !!item || !!activeSection;

  return (
    <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
      <div className="flex-grow p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="page">页面</Label>
            <Select name="page" value={formData.page} disabled>
              <SelectTrigger id="page">
                <SelectValue placeholder="选择页面" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(pageConfig).map(p => <SelectItem key={p} value={p}>{pageConfig[p].name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">模块</Label>
            <Select name="section" value={formData.section} onValueChange={(val) => handleSelectChange('section', val)} disabled={isSectionSelectDisabled}>
              <SelectTrigger id="section">
                <SelectValue placeholder="选择模块" />
              </SelectTrigger>
              <SelectContent>
                {currentSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
         {renderContentFields()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">位置 (排序号)</Label>
          <Input id="position" name="position" type="number" value={formData.position} onChange={handleInputChange} />
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))} />
          <Label htmlFor="is_active" className="font-medium">启用此内容项</Label>
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-t bg-gray-50 flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
};

export default ContentItemForm;