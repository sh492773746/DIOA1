import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PostSkeleton = () => {
  return (
    <div className="space-y-4">
        <Card className="bg-white rounded-lg shadow-sm border-none p-4">
          <CardHeader className="p-0 pb-3 flex-row items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-sm border-none p-4">
          <CardHeader className="p-0 pb-3 flex-row items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </CardContent>
        </Card>
    </div>
  );
};

export default PostSkeleton;