import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://pitcghqftgamgsduqgbr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGNnaHFmdGdhbWdzZHVxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1OTcxODAsImV4cCI6MjA3MjE3MzE4MH0.HLEO09GnWvT7EFS3RIM9zcljuoepFN41zfz4UuVmalM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})