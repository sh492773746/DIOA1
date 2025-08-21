import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (query, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error, status, count } = await query();
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            return { data, error, status, count };
        } catch (e) {
            if (i === retries - 1) {
                console.error(`Fetch failed after ${retries} retries:`, e);
                toast({
                    variant: "destructive",
                    title: "Помилка мережі",
                    description: "Не вдалося отримати дані після кількох спроб. Перевірте з’єднання з Інтернетом."
                });
                throw e;
            }
            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, e.message);
            await sleep(delay);
        }
    }
    return { data: null, error: new Error('Exhausted retries'), status: 500, count: null };
};
