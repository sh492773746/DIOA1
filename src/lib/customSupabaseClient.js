import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dexunxlwrohptjeteitw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleHVueGx3cm9ocHRqZXRlaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTI0ODEsImV4cCI6MjA2NjUyODQ4MX0.UvdYSDWI7m3ZBRyAemC1qtmjfYfAeKX5OdkDVzfCASc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);