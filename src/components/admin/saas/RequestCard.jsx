import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { MoreVertical, ExternalLink, Edit } from 'lucide-react';
import StatusBadge from '@/components/admin/saas/StatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RequestCard = ({ request, isSubmitting, onApprove, onReject, onDelete }) => {
  const navigate = useNavigate();

  const handleManageContent = (tenantId) => {
    navigate(`/admin/saas/content/${tenantId}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={request.profile?.avatar_url} />
            <AvatarFallback>{request.profile?.username?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{request.profile?.username}</CardTitle>
        </div>
        <StatusBadge status={request.status} />
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <p><strong>旺旺:</strong> {request.contact_wangwang}</p>
        <p><strong>自定义域名:</strong> 
          <a href={`https://${request.desired_domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            {request.desired_domain} <ExternalLink className="h-4 w-4" />
          </a>
        </p>
        <p><strong>Vercel域名:</strong> 
          {request.vercel_assigned_domain ? (
            <a href={`https://${request.vercel_assigned_domain}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline flex items-center gap-1">
              {request.vercel_assigned_domain} <ExternalLink className="h-4 w-4" />
            </a>
          ) : 'N/A'}
        </p>
        <p className="text-sm text-gray-500">申请于: {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm')}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {request.status === 'pending' && (
          <>
            <Button 
                onClick={() => onApprove(request)} 
                disabled={isSubmitting === request.id}
                size="sm"
            >
              {isSubmitting === request.id ? '处理中...' : '批准'}
            </Button>
            <Button 
                variant="outline" 
                onClick={() => onReject(request)}
                size="sm"
            >
              驳回
            </Button>
          </>
        )}
        {request.status === 'approved' && (
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleManageContent(request.id)}
            >
                <Edit className="mr-2 h-4 w-4" />
                管辖内容
            </Button>
        )}
        <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDelete(request)}
            disabled={isSubmitting === request.id}
        >
            {isSubmitting === request.id ? '删除中...' : '删除'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RequestCard;