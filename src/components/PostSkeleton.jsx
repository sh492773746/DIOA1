import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PostSkeleton = () => {
  return (
    <Card className="bg-white rounded-lg shadow-sm border-none">
      <CardHeader className="p-3 pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3 pt-0">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
            <div className="flex items-center space-x-6">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostSkeleton;