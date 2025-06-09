import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false, // Disable session persistence for demo
  },
  db: {
    schema: "public",
  },
})

// Demo user ID for testing
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

// Helper function to create unique channel names
export const createChannelName = (base: string) => `${base}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Helper function to check if Supabase is properly configured
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true })

    if (error) {
      console.warn("Supabase connection issue:", error.message)
      return false
    }

    console.log("✅ Supabase connected successfully")
    return true
  } catch (error) {
    console.warn("❌ Supabase connection failed:", error)
    return false
  }
}
