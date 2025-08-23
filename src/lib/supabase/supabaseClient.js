import { createClient } from "@supabase/supabase-js";

// Estas variables deberían estar en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing. Did you set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file?"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const { data, error } = await supabase.from("teams").select("id").limit(1);
console.log("Ping result:", { data, error });

// Optional: debug log
supabase.auth.getSession().then(({ data, error }) => {
  console.log("Initial session check:", data, error);
});
// Funciones de autenticación
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
