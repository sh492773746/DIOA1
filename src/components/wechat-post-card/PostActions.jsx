import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Pin, PinOff, Trash2 } from 'lucide-react';

const PostActions = ({ isAuthor, isAdmin, isPinned, onEdit, onTogglePin, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {isAuthor && <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /><span>编辑</span></DropdownMenuItem>}
      {isAdmin && (
        <>
          <DropdownMenuItem onClick={onTogglePin}>
            {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
            <span>{isPinned ? '取消置顶' : '置顶'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      {(isAuthor || isAdmin) && <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>删除</span></DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default PostActions;