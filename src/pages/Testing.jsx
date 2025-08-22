import { useEffect } from "react";
import { supabase } from "../lib/supabase/supabaseClient";
import { useSupabaseSession } from "../context/useSupabaseSession";

const Testing = () => {
  const { session } = useSupabaseSession();
  console.log(session);
  useEffect(() => {
    // supabase.auth.getSession().then(console.log).catch(console.error);
  }, []);
  return <div>Testing</div>;
};

export default Testing;
