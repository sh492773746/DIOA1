import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { BarChart, RefreshCw, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const Prediction = () => {
  const [activeAlgorithm, setActiveAlgorithm] = useState('算法1');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    '算法1': {
      accuracy: 80.00,
      history: [
        { id: 3320013, result: '等待结果', prediction: ['双', '大'], status: 'pending' },
        { id: 3320012, result: '小双', prediction: ['双', '大'], status: 'correct' },
        { id: 3320011, result: '小双', prediction: ['双', '大'], status: 'correct' },
        { id: 3320010, result: '小单', prediction: ['双', '小'], status: 'correct' },
        { id: 3320009, result: '大双', prediction: ['双', '小'], status: 'correct' },
        { id: 3320008, result: '大双', prediction: ['双', '大'], status: 'correct' },
        { id: 3320007, result: '小双', prediction: ['双', '小'], status: 'correct' },
      ],
    },
    '算法2': {
      accuracy: 75.50,
      history: [
        { id: 3320013, result: '等待结果', prediction: ['单', '小'], status: 'pending' },
        { id: 3320012, result: '小双', prediction: ['双', '小'], status: 'wrong' },
        { id: 3320011, result: '小双', prediction: ['双', '大'], status: 'correct' },
        { id: 3320010, result: '小单', prediction: ['单', '大'], status: 'wrong' },
      ],
    },
    '算法3': {
      accuracy: 85.20,
      history: [
        { id: 3320013, result: '等待结果', prediction: ['大', '单'], status: 'pending' },
        { id: 3320012, result: '小双', prediction: ['大', '双'], status: 'correct' },
      ],
    },
    '算法4': {
      accuracy: 68.90,
      history: [],
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast({
      title: "正在刷新...",
      description: `正在获取 ${activeAlgorithm} 的最新数据。`,
    });
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "刷新完成！",
        description: `数据已更新为最新状态。`,
      });
    }, 1500);
  };
  
  const currentData = useMemo(() => data[activeAlgorithm], [data, activeAlgorithm]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'correct':
        return <span className="px-3 py-1 text-sm font-bold text-white bg-red-500 rounded">对</span>;
      case 'wrong':
        return <span className="px-3 py-1 text-sm font-bold text-white bg-gray-500 rounded">错</span>;
      case 'pending':
      default:
        return <span className="text-gray-500">-</span>;
    }
  };

  const getPredictionBadge = (type) => {
    const isPrimary = ['大', '单'].includes(type);
    return (
      <span className={cn(
        'px-2 py-0.5 text-sm font-semibold text-white rounded mx-0.5',
        isPrimary ? 'bg-sky-500' : 'bg-orange-500'
      )}>{type}</span>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>算法预测 - SocialSphere</title>
        <meta name="description" content="加拿大28 - 算法预测" />
      </Helmet>
      <div className="p-2 sm:p-4 bg-gray-100 min-h-full flex items-center justify-center">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg rounded-xl overflow-hidden border-none">
            <header className="bg-blue-600 text-white p-4 flex items-center">
              <BarChart className="w-6 h-6 mr-3" />
              <h1 className="text-xl font-bold">加拿大28 - 算法预测</h1>
            </header>
            
            <CardContent className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                {['算法1', '算法2', '算法3', '算法4'].map(algo => (
                  <Button
                    key={algo}
                    variant={activeAlgorithm === algo ? 'default' : 'secondary'}
                    className={cn('w-full', activeAlgorithm === algo ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-200 text-gray-700')}
                    onClick={() => setActiveAlgorithm(algo)}
                  >
                    {algo}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center">
                  <Percent className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-gray-700">
                    准确率: <span className="font-bold text-green-600">{currentData.accuracy.toFixed(2)}%</span> (近15期)
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
                  刷新数据
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm text-center bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-blue-500 text-white">
                    <tr>
                      <th className="py-3 px-2 font-semibold">期号</th>
                      <th className="py-3 px-2 font-semibold">开奖</th>
                      <th className="py-3 px-2 font-semibold">预测</th>
                      <th className="py-3 px-2 font-semibold">对错</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentData.history.length > 0 ? (
                      currentData.history.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          className="hover:bg-gray-50"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="py-3 px-2 text-gray-600 font-medium">{item.id}</td>
                          <td className="py-3 px-2 text-gray-800">{item.result}</td>
                          <td className="py-3 px-2">
                            {item.prediction.map(p => getPredictionBadge(p))}
                          </td>
                          <td className="py-3 px-2">{getStatusBadge(item.status)}</td>
                        </motion.tr>
                      ))
                    ) : (
                       <tr>
                         <td colSpan="4" className="py-8 text-gray-500">
                           暂无历史数据
                         </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Prediction;