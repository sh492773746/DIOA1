import { supabase as supabaseClient } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (query, retries = 2, delay = 1000) => {
    if (!supabaseClient) {
        console.error("Supabase client is not available for fetchWithRetry.");
        return { data: null, error: new Error('Supabase client not initialized'), status: 500, count: null };
    }

    for (let i = 0; i <= retries; i++) {
        try {
            const { data, error, status, count } = await query();
            
            if (error) {
                if (error.message.includes('session_not_found') || error.code === 'PGRST116' || error.message.includes('aborted')) {
                    return { data, error, status, count };
                }
                throw error;
            }
            return { data, error, status, count };
        } catch (e) {
            if (e instanceof TypeError && e.message === 'Failed to fetch') {
                console.warn(`NetworkError: Failed to fetch. Attempt ${i + 1} of ${retries + 1}. Retrying in ${delay}ms...`);
                if (i === retries) {
                    console.error(`Fetch failed after ${retries + 1} attempts due to network error.`);
                    toast({
                        variant: "destructive",
                        title: "网络连接失败",
                        description: "无法连接到服务器。请检查您的网络连接并重试。"
                    });
                    return { data: null, error: e, status: 0, count: null };
                }
                await sleep(delay * (i + 1));
                continue;
            }

            if (e.message.includes('aborted')) {
                 console.warn('Fetch was aborted. This is often normal in React applications.');
                 return { data: null, error: e, status: 0, count: null };
            }

            if (i === retries) {
                console.error(`Fetch failed after ${retries + 1} attempts:`, e);
                toast({
                    variant: "destructive",
                    title: "请求错误",
                    description: `多次尝试后无法获取数据: ${e.message}`
                });
                return { data: null, error: e, status: 500, count: null };
            }

            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, e.message);
            await sleep(delay);
        }
    }
    return { data: null, error: new Error('Exhausted retries unexpectedly.'), status: 500, count: null };
};