import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
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
        free_ads_count: user.free_ads_count || 0,
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
    const numericFields = ['points', 'virtual_currency', 'free_ads_count', 'uid'];
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
    if (!isChanged) {
        onClose();
        return;
    }
    setLoading(true);

    const { error } = await supabase.rpc('update_user_profile_by_admin', {
      target_user_id: user.id,
      new_username: formData.username,
      new_role: formData.role,
      new_points: formData.points,
      new_virtual_currency: formData.virtual_currency,
      new_free_ads_count: formData.free_ads_count,
      new_uid: formData.uid
    });

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error.message,
      });
    } else {
      toast({
        title: '更新成功',
        description: `用户 ${formData.username} 的资料已更新。`,
      });
      onSave({ ...user, ...formData });
      onClose();
    }
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
              <Label htmlFor="free_ads_count" className="text-right">免费广告</Label>
              <Input id="free_ads_count" type="number" value={formData.free_ads_count || 0} onChange={handleChange} className="col-span-3" />
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