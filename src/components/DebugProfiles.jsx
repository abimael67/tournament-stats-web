import React, { useState } from 'react';
import { supabase } from '../lib/supabase/supabaseClient';

const DebugProfiles = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testProfilesQuery = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing profiles query...');
      
      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session:', session, 'Session Error:', sessionError);
      
      if (!session) {
        setResult({ error: 'No hay sesión activa' });
        setLoading(false);
        return;
      }
      
      // Probar consulta a profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      console.log('Profiles query result:', { data, error });
      
      // Probar consulta específica del usuario actual
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      console.log('User profile query result:', { userProfile, userError });
      
      setResult({
        session: {
          userId: session.user.id,
          email: session.user.email
        },
        allProfiles: { data, error },
        userProfile: { data: userProfile, error: userError }
      });
      
    } catch (err) {
      console.error('Error in test:', err);
      setResult({ error: err.message });
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Debug Profiles Query</h3>
      <button onClick={testProfilesQuery} disabled={loading}>
        {loading ? 'Testing...' : 'Test Profiles Query'}
      </button>
      
      {result && (
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          marginTop: '10px',
          fontSize: '12px',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DebugProfiles;