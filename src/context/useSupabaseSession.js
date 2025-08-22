import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = null; //createClient(supabaseUrl, supabaseAnonKey);

export function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const init = async () => {
      try {
        // 1. Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error("getSession error:", error);
        setSession(session ?? null);
      } catch (err) {
        console.error("Unexpected error getting session:", err);
      } finally {
        setLoading(false);
      }

      // 2. Listen for changes
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session ?? null);
      });

      subscription = sub;
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
