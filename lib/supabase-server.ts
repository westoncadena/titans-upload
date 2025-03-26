import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function createServerClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: false,
                storageKey: 'sb-auth-token'
            },
            global: {
                fetch: fetch.bind(globalThis),
                headers: {
                    'Cookie': cookieStore.toString()
                }
            }
        }
    );
} 