
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/ImageUploader';
import IconPicker from '@/components/admin/IconPicker';
import { ScrollArea } from '@/components/ui/scroll-area';

const ContentItemForm = ({ isOpen, onClose, onSubmit, initialData = null, fields = [], title, loading, categoryOptions = [] }) => {
    const [formData, setFormData] = useState({});
    const { toast } = useToast();

    const initializeForm = useCallback(() => {
        if (initialData) {
            setFormData(initialData.content);
        } else {
            const defaultState = fields.reduce((acc, field) => {
                let defaultValue;
                switch(field.type) {
                    case 'boolean':
                        defaultValue = false;
                        break;
                    case 'number':
                        defaultValue = field.defaultValue ?? '';
                        break;
                    default:
                        defaultValue = field.defaultValue ?? '';
                }
                acc[field.id] = defaultValue;
                return acc;
            }, {});
            setFormData(defaultState);
        }
    }, [initialData, fields]);

    useEffect(() => {
        if (isOpen) {
            initializeForm();
        }
    }, [isOpen, initializeForm]);


    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, initialData?.id);
    };

    const renderField = (field) => {
        const value = formData[field.id];

        switch (field.type) {
            case 'text':
            case 'number':
                return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={field.id} className="text-right">{field.label}</Label>
                        <Input 
                            id={field.id} 
                            type={field.type}
                            value={value ?? ''} 
                            onChange={(e) => handleChange(field.id, e.target.value)} 
                            className="col-span-3" 
                            placeholder={field.placeholder}
                        />
                    </div>
                );
            case 'textarea':
                return (
                     <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor={field.id} className="text-right pt-2">{field.label}</Label>
                        <Textarea id={field.id} value={value ?? ''} onChange={(e) => handleChange(field.id, e.target.value)} className="col-span-3" placeholder={field.placeholder}/>
                    </div>
                );
            case 'image':
                 return (
                    <div key={field.id} className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor={field.id} className="text-right pt-2">{field.label}</Label>
                        <div className="col-span-3">
                            <ImageUploader 
                                initialUrl={value}
                                onUrlChange={(url) => handleChange(field.id, url)}
                                hint={field.hint}
                            />
                        </div>
                    </div>
                );
            case 'boolean':
                return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={field.id} className="text-right">{field.label}</Label>
                        <div className="col-span-3 flex items-center">
                          <Switch id={field.id} checked={!!value} onCheckedChange={(checked) => handleChange(field.id, checked)} />
                        </div>
                    </div>
                );
            case 'select':
                 const options = field.id === 'category_slug' ? categoryOptions : (field.options || []);
                 return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={field.id} className="text-right">{field.label}</Label>
                        <Select value={value ?? ''} onValueChange={(val) => handleChange(field.id, val)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'icon':
                return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={field.id} className="text-right">{field.label}</Label>
                        <div className="col-span-3">
                            <IconPicker value={value ?? ''} onChange={(iconName) => handleChange(field.id, iconName)} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{title || '编辑内容'}</DialogTitle>
                    <DialogDescription>
                        在此处修改内容。完成后点击保存。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                    <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
                        {fields.map(renderField)}
                    </form>
                </div>
                <DialogFooter className="pt-4 mt-auto border-t">
                    <Button type="button" variant="outline" onClick={onClose}>取消</Button>
                    <Button type="button" onClick={handleFormSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ContentItemForm;
