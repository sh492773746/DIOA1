import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const InvitePage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { siteSettings } = useAuth();

  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('inviteCode', inviteCode);
    }
  }, [inviteCode]);

  const handleJoin = () => {
    navigate('/auth');
  };

  const siteName = siteSettings?.site_name || '大海团队';
  const siteLogoUrl = siteSettings?.site_logo_url;

  return (
    <>
      <Helmet>
        <title>{String('你被邀请了！加入' + siteName)}</title>
        <meta name="description" content={`通过邀请链接加入${siteName}，探索更多精彩内容！`} />
        <meta property="og:title" content={`你被邀请了！加入${siteName}`} />
        <meta property="og:description" content={`通过邀请链接加入${siteName}，探索更多精彩内容！`} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <Card className="w-full max-w-md bg-card/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-border text-center text-foreground">
            <CardHeader className="pt-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-primary/10 border-2 border-primary"
              >
                <Avatar className="w-full h-full">
                  {siteLogoUrl ? (
                    <AvatarImage src={siteLogoUrl} alt={`${siteName} Logo`} />
                  ) : (
                    <AvatarImage src="https://horizons-cdn.hostinger.com/05c1c223-1f7f-4436-89e0-214b6c7f1cc7/ca5e112327f3a69b9d57fc879b1a816d.png" alt="默认团队Logo" />
                  )}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-xl">
                    {siteName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <CardTitle className="text-3xl font-bold text-foreground mt-4">你被邀请了！</CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                {siteName}，与兄弟们探索乐趣！
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4 text-left bg-muted/30 p-6 rounded-xl mb-6 border border-border">
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">加入我们</h3>
                    <p className="text-sm text-muted-foreground">为我们团队贡献一份力量！</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Zap className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">注册奖励</h3>
                    <p className="text-sm text-muted-foreground">注册即可获得免费积分礼包！</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                你的邀请码 <strong className="text-foreground">{inviteCode}</strong> 已自动应用。
              </p>

              <Button
                onClick={handleJoin}
                variant="gradient"
                size="lg"
                className="w-full shadow-lg transform hover:scale-105 transition-transform duration-300 text-lg"
              >
                立即加入
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default InvitePage;