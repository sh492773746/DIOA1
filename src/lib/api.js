
import { supabase } from '@/lib/customSupabaseClient';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (query, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error, status, count } = await query();
            if (error && error.code !== 'PGRST116') { // PGRST116 is 'No rows found', which is not a fetch error
                throw error;
            }
            return { data, error, status, count };
        } catch (e) {
            if (i === retries - 1) {
                console.error(`Fetch failed after ${retries} retries:`, e);
                throw e;
            }
            console.warn(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`, e.message);
            await sleep(delay);
        }
    }
};
