import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShoppingCart, Gem, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const fetchProducts = async tenantId => {
  const {
    data,
    error
  } = await supabase.from('shop_products').select('*').eq('is_active', true).in('tenant_id', [0, tenantId]).order('price', {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data;
};
const ProductCard = ({
  product,
  onRedeem,
  userPoints
}) => {
  const canAfford = userPoints >= product.price;
  return <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="aspect-video overflow-hidden">
          <img alt={product.name} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1671376354106-d8d21e55dddd" />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 flex flex-col items-start space-y-3">
        <div className="flex items-center font-bold text-primary text-lg">
          <Gem className="w-5 h-5 mr-2" />
          <span>{product.price} 积分</span>
        </div>
        {product.stock !== -1 && <p className="text-xs text-muted-foreground">剩余库存: {product.stock}</p>}
        <Button className="w-full" onClick={() => onRedeem(product)} disabled={!canAfford || product.stock !== -1 && product.stock <= 0}>
          {product.stock !== -1 && product.stock <= 0 ? '已售罄' : canAfford ? '立即兑换' : '积分不足'}
        </Button>
      </CardFooter>
    </Card>;
};
const ProductSkeleton = () => <Card className="flex flex-col">
    <Skeleton className="aspect-video w-full" />
    <CardContent className="p-4 flex-grow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardContent>
    <CardFooter className="p-4 bg-gray-50 flex flex-col items-start space-y-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>;
const PointsMall = () => {
  const {
    tenantId,
    profile,
    refreshProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    data: products,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shop_products', tenantId],
    queryFn: () => fetchProducts(tenantId)
  });
  const handleRedeemClick = product => {
    setSelectedProduct(product);
  };
  const handleConfirmRedeem = async () => {
    if (!selectedProduct) return;
    setIsConfirming(true);
    try {
      const {
        error
      } = await supabase.rpc('redeem_shop_product', {
        p_product_id: selectedProduct.id
      });
      if (error) throw error;
      toast({
        title: '兑换成功!',
        description: `您已成功兑换 ${selectedProduct.name}。请等待管理员处理。`,
        action: <CheckCircle className="text-green-500" />
      });
      refreshProfile();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '兑换失败',
        description: err.message || '发生未知错误，请稍后重试。'
      });
    } finally {
      setIsConfirming(false);
      setSelectedProduct(null);
    }
  };
  return <>
      <Helmet>
        <title>积分商城</title>
        <meta name="description" content="使用您的积分兑换精美虚拟商品。" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            积分商城
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">证明请填写我们旗下注册的UID</p>
          <div className="mt-4 inline-flex items-center justify-center bg-primary/10 text-primary font-semibold px-4 py-2 rounded-full">
            <Gem className="w-5 h-5 mr-2" />
            <span>我的积分: {profile?.points || 0}</span>
          </div>
        </div>

        {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({
          length: 8
        }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>}

        {error && <div className="text-center py-10 bg-red-50 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-medium text-red-800">加载商品失败</h3>
            <p className="mt-1 text-sm text-red-700">{error.message}</p>
          </div>}

        {!isLoading && !error && products?.length === 0 && <div className="text-center py-10 bg-gray-50 rounded-lg">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-800">商城正在补货中</h3>
            <p className="mt-1 text-sm text-gray-500">敬请期待，很快就会有新商品上架！</p>
          </div>}

        {!isLoading && !error && products && products.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => <ProductCard key={product.id} product={product} onRedeem={handleRedeemClick} userPoints={profile?.points || 0} />)}
          </div>}
      </div>

      <AlertDialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认兑换</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要使用 <span className="font-bold text-primary">{selectedProduct?.price}</span> 积分兑换 <span className="font-bold">{selectedProduct?.name}</span> 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>取消</AlertDialogCancel>
            <Button onClick={handleConfirmRedeem} disabled={isConfirming}>
              {isConfirming ? '处理中...' : '确认兑换'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};
export default PointsMall;