import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Minus } from 'lucide-react';

const EditUserDialog = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const userData = {
        username: user.username || '',
        role: user.role || 'user',
        points: user.points || 0,
        virtual_currency: user.virtual_currency || 0,
        free_posts_count: user.free_posts_count || 0,
        uid: user.uid || '',
      };
      setFormData(userData);
      setInitialData(userData);
    }
  }, [user]);

  const isChanged = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const numericFields = ['points', 'virtual_currency', 'free_posts_count', 'uid'];
    const numericValue = numericFields.includes(id) 
      ? value === '' ? '' : parseInt(value.replace(/[^0-9]/g, ''), 10)
      : value;
    setFormData(prev => ({ ...prev, [id]: numericValue }));
  };
  
  const handlePointsChange = (amount) => {
    setFormData(prev => ({
      ...prev,
      points: Math.max(0, (prev.points || 0) + amount)
    }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast({
        variant: 'destructive',
        title: '功能已禁用',
        description: '请先集成数据库以启用此功能。',
    });
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑用户: {user?.username}</DialogTitle>
          <DialogDescription>在此处修改用户的资料。完成后点击保存。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uid" className="text-right">UID</Label>
              <Input id="uid" value={formData.uid || ''} onChange={handleChange} className="col-span-3" maxLength="8" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">用户名</Label>
              <Input id="username" value={formData.username || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">角色</Label>
              <Select value={formData.role} onValueChange={handleSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">积分</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => handlePointsChange(-50)}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Input id="points" type="number" value={formData.points || 0} onChange={handleChange} className="w-full text-center" />
                 <Button type="button" variant="outline" size="icon" onClick={() => handlePointsChange(50)}>
                    <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="virtual_currency" className="text-right">虚拟币</Label>
              <Input id="virtual_currency" type="number" value={formData.virtual_currency || 0} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="free_posts_count" className="text-right">免费发布</Label>
              <Input id="free_posts_count" type="number" value={formData.free_posts_count || 0} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={loading || !isChanged}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;