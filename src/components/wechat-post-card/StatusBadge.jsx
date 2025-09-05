import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status, rejectionReason }) => {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  if (!isPending && !isRejected) return null;

  const statusConfig = {
    pending: {
      text: '审核中',
      icon: <Clock className="h-3 w-3 mr-1" />,
      variant: 'secondary',
      className: 'bg-yellow-100 text-yellow-800'
    },
    rejected: {
      text: '未通过',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      variant: 'destructive',
      className: 'bg-red-100 text-red-800'
    }
  };

  const config = statusConfig[status];

  if (isRejected) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Badge variant={config.variant} className={`cursor-pointer ${config.className}`}>
            {config.icon}
            {config.text}
          </Badge>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>帖子被拒原因</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectionReason || '管理员未提供具体原因。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>好的</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {config.text}
    </Badge>
  );
};

export default StatusBadge;