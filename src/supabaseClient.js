import { createClient } from '@supabase/supabase-js'

// These grab the secret keys you saved in your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This creates the single connection we will use across the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)