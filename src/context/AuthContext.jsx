import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/supabaseClient';
import { AuthContext } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Función simplificada para verificar si el usuario es admin
  const checkUserAdminRole = async (userId) => {
    try {
      console.log('🔍 Checking admin role for user:', userId);
      
      // Verificar primero si tenemos una sesión válida
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ No session available for admin check');
        return false;
      }
      
      // Usar una consulta más simple sin AbortController
      console.log('📊 Executing profiles query for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores si no existe
      
      console.log('📊 Query result - Data:', data, 'Error:', error);
      
      if (error) {
        console.error('❌ Error checking admin role:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        return false;
      }
      
      if (!data) {
        console.log('⚠️ No profile found for user, defaulting to false');
        return false;
      }
      
      const isAdmin = data.role === 'admin';
      console.log('✅ Admin check result:', isAdmin, 'Role:', data.role);
      return isAdmin;
    } catch (error) {
      console.error('💥 Error checking admin role:', error.message);
      return false;
    }
  };





  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
        console.log('🔧 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
        
        // SOLUCIÓN: Evitar health check durante la inicialización
        // El health check también puede causar timeouts y bloquear la app
        console.log('🏥 Skipping health check to avoid blocking initialization');
        
        // SOLUCIÓN: Evitar getSession durante la inicialización debido a timeouts
        // En su lugar, usar el listener de auth state change que es más confiable
        console.log('🔐 Skipping getSession due to timeout issues, using auth listener instead');
        
        // Inicializar con estado por defecto
        let session = null;
        console.log('✅ Initialization completed without blocking calls');
        
        if (session?.user) {
            console.log('✅ Initial session found for:', session.user.email);
            setUser(session.user);
            
            // No verificar admin role durante la inicialización para evitar bloqueos
            // Se verificará cuando sea necesario (ej: al acceder a rutas admin)
            console.log('⏭️ Skipping admin check during initialization to avoid blocking');
            setIsAdmin(false); // Default to false, will be checked later if needed
          } else {
          console.log('❌ No initial session found');
          setUser(null);
          setIsAdmin(false);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };
    
    initializeAuth();

    // Escuchar cambios en la autenticación (MEJORADO)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', {
          event,
          userEmail: session?.user?.email || 'No user',
          timestamp: new Date().toISOString()
        });
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, ignoring auth event');
          return;
        }
        
        try {
          if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setIsAdmin(false);
            navigate('/login');
          } else if (event === 'SIGNED_IN' && session?.user) {
            console.log('👤 User signed in:', session.user.email);
            setUser(session.user);
            // No verificar admin role aquí para evitar bloqueos
            setIsAdmin(false);
            console.log('✅ User state updated successfully');
          } else if (session?.user) {
            console.log('👤 Setting user from auth state change');
            setUser(session.user);
            setIsAdmin(false);
          } else {
            console.log('🚪 Clearing user state (logout/no session)');
            setUser(null);
            setIsAdmin(false);
          }
          
          console.log('🏁 Auth state change processing completed');
        } catch (authError) {
          console.error('🚨 Error processing auth state change:', {
            message: authError.message,
            event,
            userEmail: session?.user?.email
          });
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  // Función para refrescar el token de autenticación
  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error al refrescar el token:', error);

        await supabase.auth.signOut();
        return false;
      } else if (data.session) {
        console.log('Token refrescado correctamente');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error inesperado al refrescar el token:', err);

      return false;
    }
  };

  // Configurar un intervalo para refrescar el token cada 50 minutos (3000000 ms)
  // El token de Supabase suele durar 1 hora, así que lo refrescamos antes
  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshToken, 3000000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Función para manejar errores de autenticación
  const handleAuthError = async (error) => {
    // Verificar si es un error de autenticación
    if (error.message?.includes('JWT expired') || 
        error.message?.includes('JWT invalid') || 
        error.message?.includes('token is invalid') || 
        error.message?.includes('not authenticated') ||
        error.code === 'PGRST301' ||
        error.code === 401) {
      console.log('Error de autenticación detectado, refrescando token...');
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        return true; // Indica que se ha manejado un error de autenticación y se puede reintentar
      } else {
        // Si no se pudo refrescar, cerrar sesión
        await supabase.auth.signOut();
        return false;
      }
    }
    return false; // No es un error de autenticación
  };

  // Función para verificar admin role bajo demanda
  const checkAdminStatus = async () => {
    if (!user) {
      console.log('❌ No user available for admin check');
      return false;
    }
    
    try {
      const adminStatus = await checkUserAdminRole(user.id);
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    refreshToken,
    handleAuthError,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}