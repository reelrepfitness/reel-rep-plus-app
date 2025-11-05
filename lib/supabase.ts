import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xzutgwqkgkykeqxotzye.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dXRnd3FrZ2t5a2VxeG90enllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzc2ODgsImV4cCI6MjA3NzY1MzY4OH0.2-B69gvmdDxYidyxu2pvL04bMcR4hnihMKkPZZJfy0c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
