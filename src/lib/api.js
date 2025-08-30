import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (query, retries = 3, delay = 1000) => {
    if (!supabase) {
        console.error("Supabase client is not available for fetchWithRetry.");
        return { data: null, error: new Error('Supabase client not initialized'), status: 500, count: null };
    }
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error, status, count } = await query();
            if (error && error.code !== 'PGRST116') { // PGRST116: The result contains 0 rows
                throw error;
            }
            return { data, error, status, count };
        } catch (e) {
            if (e instanceof TypeError && e.message === 'Failed to fetch') {
                 console.error('Fetch failed due to a network error or CORS issue:', e);
                 toast({
                    variant: "destructive",
                    title: "网络请求失败",
                    description: "无法连接到服务器。这可能是由于网络问题或浏览器插件（如广告拦截器）阻止了请求。请检查您的网络和插件设置后重试。"
                });
                // Don't retry on this specific error, as it's likely persistent.
                throw e;
            }

            if (i === retries - 1) {
                console.error(`Fetch failed after ${retries} retries:`, e);
                toast({
                    variant: "destructive",
                    title: "网络错误",
                    description: "多次尝试后无法获取数据。请检查您的网络连接。"
                });
                throw e;
            }
            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, e.message);
            await sleep(delay);
        }
    }
    // This part should be unreachable if the loop always throws on final failure
    return { data: null, error: new Error('Exhausted retries'), status: 500, count: null };
};