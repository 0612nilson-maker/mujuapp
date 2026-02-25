import { createClient } from '@supabase/supabase-js';

// 從 .env.local 保險箱中拿出你的網址與金鑰
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 建立並輸出這個唯一連線
export const supabase = createClient(supabaseUrl, supabaseAnonKey);