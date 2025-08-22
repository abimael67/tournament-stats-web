import { useEffect, useState } from "react";
import {
  supabase,
  //signIn as supabaseSignIn,
} from "../lib/supabase/supabaseClient";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap function to initialize Supabase client safely
  const bootstrapSupabase = async () => {
    try {
      // harmless "warmup" query to force client init
      await supabase.from("teams").select("id").limit(1);
    } catch (e) {
      console.error(e);
    }
  };

  // Load user profile from DB
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create a basic one in memory
        setProfile({ id: userId, role: "user" });
      } else {
        setProfile(data);
      }
    } catch (e) {
      setProfile({ id: userId, role: "user" });
      console.error(e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await bootstrapSupabase();

      // Get initial session
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user ?? null;
      if (sessionUser) {
        setUser(sessionUser);
        await loadUserProfile(sessionUser.id);
      }
      setLoading(false);

      // Listen to auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      // Sync session when tab becomes visible
      const handleVisibilityChange = async () => {
        if (document.visibilityState === "visible") {
          const { data } = await supabase.auth.getSession();
          const sessionUser = data?.session?.user ?? null;
          if (sessionUser) {
            setUser(sessionUser);
            await loadUserProfile(sessionUser.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      };
      window.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        subscription.unsubscribe();
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    };

    initAuth();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      return { data, error };
    } catch (e) {
      setLoading(false);
      return { data: null, error: e };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    return { error };
  };

  const isAdmin = () => profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signOut, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
