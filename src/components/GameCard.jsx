import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Gamepad2, Info, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

const GameCard = ({ game }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (path, requiresAuth) => {
    if (requiresAuth && !user) {
      toast({
        title: "请先登录",
        description: "登录后才能访问该页面。",
        variant: "destructive",
      });
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  const handleLongPress = (e) => {
    e.preventDefault();
    setIsAlertOpen(true);
  };

  const handleAddToDesktop = () => {
    toast({
      title: "🚧 功能正在开发中",
      description: "添加到桌面功能即将推出，敬请期待！",
    });
    setIsAlertOpen(false);
  };

  return (
    <>
      <motion.div
        onContextMenu={handleLongPress}
        whileTap={{ scale: 0.95 }}
      >
        <Card
          className="bg-white rounded-lg shadow-sm border-none text-center p-0.5 flex flex-col items-center justify-between aspect-square cursor-pointer card-hover"
          onClick={() => handleNavigate(game.path, game.requiresAuth)}
        >
          <div className="w-10 h-10 rounded-md flex items-center justify-center mt-0.5 mb-0.5 overflow-hidden bg-gray-100">
            {game.iconUrl ? (
              <img src={game.iconUrl} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <Gamepad2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <h3 className="text-xs font-semibold text-gray-800 mb-0">{game.title}</h3>
          <p className="text-[10px] text-gray-500 mb-0.5 leading-tight scale-90">{game.description}</p>
          <div className="flex items-center justify-center text-blue-500 text-[10px] mb-0.5 scale-90">
            <Info className="w-2.5 h-2.5 mr-0.5" />
            {game.info}
          </div>
          <Button variant="gradient" className="w-full text-xs h-6">
            进入游戏
          </Button>
        </Card>
      </motion.div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{game.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {game.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button onClick={handleAddToDesktop} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              添加到桌面
            </Button>
            <AlertDialogAction onClick={() => handleNavigate(game.path, game.requiresAuth)}>进入游戏</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GameCard;