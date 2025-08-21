import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Globe, MessageSquare, Send, Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const TenantRequestForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [desiredDomain, setDesiredDomain] = useState('');
  const [contactWangWang, setContactWangWang] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [domainAvailability, setDomainAvailability] = useState(null); // null, 'available', 'unavailable', 'error'

  const debouncedDomain = useDebounce(desiredDomain, 500);

  const checkDomainAvailability = useCallback(async () => {
    if (!debouncedDomain) {
      setDomainAvailability(null);
      return;
    }
    setIsCheckingDomain(true);
    setDomainAvailability(null);
    try {
      const { data, error } = await supabase.functions.invoke('check-domain-availability', {
        body: JSON.stringify({ domain: debouncedDomain }),
      });

      if (error) throw error;

      if (data.available) {
        setDomainAvailability('available');
      } else {
        setDomainAvailability('unavailable');
      }
    } catch (error) {
      setDomainAvailability('error');
      toast({
        variant: 'destructive',
        title: '域名检查失败',
        description: error.message || '无法连接到域名服务，请稍后重试。',
      });
    } finally {
      setIsCheckingDomain(false);
    }
  }, [debouncedDomain, toast]);

  const handleWangWangChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setContactWangWang(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desiredDomain.trim() || !contactWangWang.trim()) {
      toast({
        variant: 'destructive',
        title: '错误',
        description: '请填写所有必填项。',
      });
      return;
    }
    if (domainAvailability !== 'available') {
      toast({
        variant: 'destructive',
        title: '域名不可用',
        description: '请先检查并确保您选择的域名是可用的。',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('tenant_requests').insert({
      user_id: user.id,
      desired_domain: desiredDomain,
      contact_wangwang: contactWangWang,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: '提交申请失败',
        description: error.message,
      });
    } else {
      toast({
        title: '申请已提交',
        description: '您的分站申请已成功提交，请等待管理员审核。',
      });
      setDesiredDomain('');
      setContactWangWang('');
      setDomainAvailability(null);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const renderDomainStatus = () => {
    if (isCheckingDomain) {
      return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    }
    if (domainAvailability === 'available') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (domainAvailability === 'unavailable') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (domainAvailability === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="desiredDomain">期望的域名</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="desiredDomain"
              placeholder="例如：myapp.com"
              value={desiredDomain}
              onChange={(e) => {
                setDesiredDomain(e.target.value);
                setDomainAvailability(null);
              }}
              required
              className="pl-10 pr-8"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderDomainStatus()}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={checkDomainAvailability} disabled={isCheckingDomain || !desiredDomain}>
            <Search className="mr-2 h-4 w-4" />
            检查
          </Button>
        </div>
        {domainAvailability === 'available' && <p className="text-sm text-green-600">恭喜！该域名可用。</p>}
        {domainAvailability === 'unavailable' && <p className="text-sm text-red-600">抱歉，该域名已被占用。</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactWangWang">旺旺号</Label>
         <div className="relative">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="contactWangWang"
            type="text"
            pattern="\d*"
            placeholder="用于接收审核结果和重要通知"
            value={contactWangWang}
            onChange={handleWangWangChange}
            required
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit" disabled={loading || domainAvailability !== 'available'} className="w-full mt-4">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在提交...</> : <><Send className="mr-2 h-4 w-4" /> 提交申请</>}
      </Button>
    </form>
  );
};

export default TenantRequestForm;