
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Input } from '@/components/ui/input';
import { Search, Info } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

import LoadingSkeleton from '@/components/admin/saas/LoadingSkeleton';
import RequestTable from '@/components/admin/saas/RequestTable';
import RequestCard from '@/components/admin/saas/RequestCard';
import RejectDialog from '@/components/admin/saas/RejectDialog';
import DeleteDialog from '@/components/admin/saas/DeleteDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminSaasManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(null);
    
    const [rejectionReason, setRejectionReason] = useState('');
    const [dialogs, setDialogs] = useState({ reject: null, delete: null });
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { toast } = useToast();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('tenant_requests')
                .select(`
                    *,
                    profile:profiles!user_id (
                        uid,
                        username,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (debouncedSearchTerm) {
                query = query.or(`profile.username.ilike.%${debouncedSearchTerm}%,desired_domain.ilike.%${debouncedSearchTerm}%`);
            }

            const { data, error: queryError } = await query;

            if (queryError) throw queryError;
            
            setRequests(data || []);
        } catch (err) {
            setError(err.message);
            toast({
                title: '获取申请列表失败',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast, debouncedSearchTerm]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (request) => {
        setIsSubmitting(request.id);
        try {
            const { data: functionData, error: functionError } = await supabase.functions.invoke('provision-tenant', {
                body: { tenantRequest: request },
            });
            
            if (functionError) throw new Error(functionError.message);
            
            const { error: dbError } = await supabase
                .from('tenant_requests')
                .update({ 
                    status: 'approved',
                    vercel_project_id: functionData.projectId,
                    vercel_assigned_domain: functionData.assignedDomain,
                    vercel_deployment_status: 'provisioning' 
                })
                .eq('id', request.id);

            if (dbError) throw dbError;

            toast({
                title: '批准成功',
                description: `${request.desired_domain} 正在部署中。`,
            });
            fetchRequests();
        } catch (err) {
            const errorMessage = err.message.includes("{") 
                ? JSON.parse(err.message).error 
                : err.message;
            toast({
                title: '批准失败',
                description: errorMessage || '未知错误',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const handleReject = async () => {
        const requestToReject = dialogs.reject;
        if (!requestToReject || !rejectionReason) {
            toast({ title: '请输入驳回原因', variant: 'destructive' });
            return;
        }
        setIsSubmitting(requestToReject.id);
        try {
            const { error } = await supabase.rpc('reject_tenant_request', {
                p_request_id: requestToReject.id,
                p_rejection_reason: rejectionReason
            });

            if (error) throw error;
            toast({
                title: '驳回成功',
                description: '该申请已被驳回。',
            });
            fetchRequests();
        } catch (err) {
            toast({
                title: '驳回失败',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(null);
            setDialogs({ ...dialogs, reject: null });
            setRejectionReason('');
        }
    };

    const handleDelete = async () => {
        const requestToDelete = dialogs.delete;
        if (!requestToDelete) return;

        setIsSubmitting(requestToDelete.id);
        try {
            if (requestToDelete.vercel_project_id) {
                const { error: functionError } = await supabase.functions.invoke('deprovision-tenant', {
                    body: { vercelProjectId: requestToDelete.vercel_project_id },
                });
                if (functionError) {
                    const errorMessage = functionError.message.includes("{") 
                        ? JSON.parse(functionError.message).error 
                        : functionError.message;
                    throw new Error(errorMessage || '删除Vercel项目失败');
                }
            }

            const { error: dbError } = await supabase
                .from('tenant_requests')
                .delete()
                .eq('id', requestToDelete.id);

            if (dbError) throw dbError;

            toast({
                title: '删除成功',
                description: '该申请及关联的Vercel项目已被删除。',
            });
            fetchRequests();
        } catch (err) {
            toast({
                title: '删除失败',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(null);
            setDialogs({ ...dialogs, delete: null });
        }
    };

    const memoizedRequests = useMemo(() => requests, [requests]);

    return (
        <>
            <Helmet>
                <title>SaaS分站管理 - 后台</title>
                <meta name="description" content="管理和审核SaaS分站申请。" />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto p-4"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">SaaS分站管理</h1>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="按用户名或域名搜索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                
                {loading ? (
                    <LoadingSkeleton isDesktop={isDesktop} />
                ) : error ? (
                    <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>加载错误</AlertTitle>
                      <AlertDescription>
                        加载申请列表时发生错误: {error}
                      </AlertDescription>
                    </Alert>
                ) : memoizedRequests.length === 0 ? (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>无申请记录</AlertTitle>
                        <AlertDescription>
                            {debouncedSearchTerm ? '未找到匹配的申请记录。' : '目前还没有任何分站申请。'}
                        </AlertDescription>
                    </Alert>
                ) : isDesktop ? (
                        <RequestTable 
                            requests={memoizedRequests}
                            isSubmitting={isSubmitting}
                            onApprove={handleApprove}
                            onReject={(request) => setDialogs({ ...dialogs, reject: request })}
                            onDelete={(request) => setDialogs({ ...dialogs, delete: request })}
                        />
                    ) : (
                        <div className="space-y-4">
                            {memoizedRequests.map((request) => (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    isSubmitting={isSubmitting}
                                    onApprove={handleApprove}
                                    onReject={(request) => setDialogs({ ...dialogs, reject: request })}
                                    onDelete={(request) => setDialogs({ ...dialogs, delete: request })}
                                />
                            ))}
                        </div>
                    )
                }

                <RejectDialog
                    isOpen={!!dialogs.reject}
                    onOpenChange={(isOpen) => !isOpen && setDialogs({ ...dialogs, reject: null })}
                    onConfirm={handleReject}
                    loading={isSubmitting === dialogs.reject?.id}
                    reason={rejectionReason}
                    setReason={setRejectionReason}
                />

                <DeleteDialog
                    isOpen={!!dialogs.delete}
                    onOpenChange={(isOpen) => !isOpen && setDialogs({ ...dialogs, delete: null })}
                    onConfirm={handleDelete}
                    loading={isSubmitting === dialogs.delete?.id}
                />
            </motion.div>
        </>
    );
};

export default AdminSaasManagement;
