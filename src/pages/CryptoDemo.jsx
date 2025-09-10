import React, { useState, useRef, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock, Unlock, Key, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const CryptoDemo = () => {
  const [textToEncrypt, setTextToEncrypt] = useState('<h1>你好，世界！</h1><p>这是一段需要被安全传输和显示的内容。</p>');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef(null);
  const { toast } = useToast();

  const handleEncrypt = () => {
    if (!textToEncrypt) {
      toast({
        variant: 'destructive',
        title: '内容不能为空',
        description: '请输入需要加密的内容。',
      });
      return;
    }
    const key = CryptoJS.lib.WordArray.random(16).toString(); // Generate a random 128-bit key
    setEncryptionKey(key);
    const encrypted = CryptoJS.AES.encrypt(textToEncrypt, key).toString();
    setEncryptedData(encrypted);
    setShowIframe(true);
    toast({
      title: '加密成功！',
      description: '内容已使用新密钥加密。',
    });
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (event.data.type === 'IFRAME_READY' && encryptedData && encryptionKey) {
        iframeRef.current.contentWindow.postMessage({
          type: 'DECRYPT_CONTENT',
          encryptedData,
          key: encryptionKey,
        }, '*'); // Use a specific target origin in production
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [encryptedData, encryptionKey]);

  return (
    <>
      <Helmet>
        <title>{String('加密内容演示 - SocialSphere')}</title>
        <meta name="description" content="演示如何加密内容并通过iframe安全地解密显示。" />
      </Helmet>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-800">内容加密与安全嵌入</h1>
            <p className="text-lg text-gray-600 mt-2">演示使用 iframe 和 postMessage 实现的安全内容分发方案。</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center"><Lock className="mr-2" /> 加密端 (父页面)</CardTitle>
                  <CardDescription>在这里输入内容，然后生成加密数据和密钥。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="content-to-encrypt" className="text-lg font-semibold">待加密内容 (支持HTML)</Label>
                    <Textarea
                      id="content-to-encrypt"
                      value={textToEncrypt}
                      onChange={(e) => setTextToEncrypt(e.target.value)}
                      rows={5}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleEncrypt} className="w-full" variant="gradient">
                    <Wand2 className="mr-2 h-4 w-4" /> 生成加密内容和密钥
                  </Button>
                  
                  {encryptionKey && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="encryption-key" className="flex items-center font-semibold"><Key className="mr-2 h-4 w-4 text-yellow-500"/>生成的密钥</Label>
                        <Input id="encryption-key" value={encryptionKey} readOnly className="mt-1 font-mono text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="encrypted-data" className="flex items-center font-semibold"><FileText className="mr-2 h-4 w-4 text-blue-500"/>加密后的数据</Label>
                        <Textarea id="encrypted-data" value={encryptedData} readOnly rows={5} className="mt-1 font-mono text-sm" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="flex items-center"><Unlock className="mr-2" /> 解密端 (Iframe)</CardTitle>
                  <CardDescription>下方是嵌入的 iframe，它将接收密钥并解密内容。</CardDescription>
                </CardHeader>
                <CardContent>
                  {showIframe ? (
                    <iframe
                      ref={iframeRef}
                      src="/encrypted-content"
                      title="Encrypted Content"
                      className="w-full h-[400px] border-2 border-dashed border-gray-300 rounded-lg"
                      sandbox="allow-scripts allow-same-origin"
                    ></iframe>
                  ) : (
                    <div className="w-full h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">点击左侧按钮后将在此处加载内容</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CryptoDemo;