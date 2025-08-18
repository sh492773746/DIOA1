
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { supabase } from '@/lib/customSupabaseClient';
import { obfuscateNode, obfuscateText } from '@/lib/obfuscator';
import { fetchWithRetry } from '@/lib/api';

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement.hasChildNodes()) {
    console.warn("Root element already has children. App might have been initialized already. Aborting new render.");
    return;
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const initializeObfuscation = async () => {
  const isInsideIframe = window.self !== window.top;
  if (!isInsideIframe) {
    startApp();
    return;
  }

  try {
    const { data, error } = await fetchWithRetry(() => supabase
      .from('app_settings')
      .select('value, key')
      .in('key', ['iframe_content_obfuscation_enabled', 'iframe_obfuscation_key'])
    );

    if (error) {
      console.error("无法获取混淆设置，正常运行应用。", error);
      startApp();
      return;
    }

    const settings = data.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    const isEnabled = settings['iframe_content_obfuscation_enabled'] === 'true';
    const masterKey = settings['iframe_obfuscation_key'];
    
    const storedKey = sessionStorage.getItem('deobfuscation_key');

    if (!isEnabled || storedKey === masterKey) {
        startApp();
        return;
    }
    
    let isObfuscated = true;

    const observer = new MutationObserver((mutations) => {
        if (!isObfuscated) return;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                obfuscateNode(node);
            });
        });
    });

    const titleObserver = new MutationObserver(() => {
        if (isObfuscated && document.title) {
          document.title = obfuscateText(document.title);
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    
    const titleElement = document.querySelector('head > title');
    if (titleElement) {
        titleObserver.observe(titleElement, { childList: true, subtree: true });
        if(document.title) document.title = obfuscateText(document.title);
    }
    
    startApp(); 

    const handleMessage = (event) => {
        const { type, key } = event.data;
        if (type === 'DEOBFUSCATE' && key === masterKey) {
            isObfuscated = false;
            observer.disconnect();
            titleObserver.disconnect();
            window.removeEventListener('message', handleMessage);
            sessionStorage.setItem('deobfuscation_key', key);
            window.location.reload();
        }
    };
    
    window.addEventListener('message', handleMessage);

  } catch (e) {
    console.error("混淆初始化期间出错，正常运行应用。", e);
    startApp();
  }
};


window.onerror = function(message, source, lineno, colno, error) {
  const errorMessage = typeof message === 'string' ? message : error?.message || '未知错误';
  if (errorMessage.includes('Failed to fetch')) {
    console.error(
      '捕获到网络请求失败 (Failed to fetch)。这通常是由于以下原因之一：\n' +
      '1. 用户的网络连接不稳定或已断开。\n' +
      '2. 浏览器插件 (如广告拦截器) 阻止了请求。\n' +
      '3. CORS (跨域资源共享) 策略配置问题。\n' +
      '请检查您的网络连接和浏览器控制台以获取更多详细信息。我们的应用内置了重试机制，但持续失败可能表明存在更深层次的问题。'
    );
    return true; // 阻止默认的错误处理
  }
};

initializeObfuscation();
