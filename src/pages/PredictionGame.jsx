import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, History, BarChart, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const PredictionGame = () => {
  const navigate = useNavigate();

  const handleNotImplemented = () => {
    toast({
      title: "🚧 功能开发中",
      description: "此功能尚未实现，敬请期待！🚀"
    });
  };

  return (
    <>
      <Helmet>
        <title>模拟28投注 - SocialSphere</title>
        <meta name="description" content="参与模拟28投注游戏，体验紧张刺激的预测乐趣。" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <header className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold">模拟28投注</h1>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleNotImplemented}>
                  <History className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNotImplemented}>
                  <BarChart className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>第 <span className="text-yellow-400">202508071234</span> 期</span>
                  <span className="text-sm font-normal text-gray-400">封盘倒计时: <span className="text-red-500 font-bold text-lg">00:25</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400 mb-4">开奖中...</p>
                <div className="flex justify-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold animate-pulse">?</div>
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold animate-pulse">?</div>
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold animate-pulse">?</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>投注区域</span>
                   <Button variant="link" className="text-blue-400 p-0 h-auto" onClick={handleNotImplemented}>
                    <HelpCircle className="w-4 h-4 mr-1" />
                    玩法说明
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <h3 className="text-lg font-semibold">投注功能开发中</h3>
                  <p className="text-gray-400 mt-2">激动人心的投注系统即将上线，敬请期待！</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default PredictionGame;