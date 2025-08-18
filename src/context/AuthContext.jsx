import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/supabaseClient';
import { AuthContext } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Función para limpiar el almacenamiento local cuando hay tokens corruptos
  const clearCorruptedSession = () => {
    try {
      // Limpiar sessionStorage de Supabase
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // También limpiar localStorage por si acaso
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Sesión corrupta limpiada del almacenamiento');
    } catch (err) {
      console.error('Error al limpiar el almacenamiento:', err);
    }
  };

  useEffect(() => {
    // Verificar la sesión actual
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          // Limpiar tokens corruptos del almacenamiento
          clearCorruptedSession();
          setUser(null);
          setIsAdmin(false);
          return;
        }
        
        if (data.session) {
          console.log('INITIAL_SESSION - Usuario:', data.session.user.email);
          setUser(data.session.user);
          
          // Verificación directa por email (solución temporal)
          const isAdminEmail = data.session.user.email === 'jamroa67@gmail.com';
          console.log('INITIAL_SESSION - ¿Es email de admin?:', isAdminEmail);
          setIsAdmin(isAdminEmail);
        } else {
          // No hay sesión activa
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error inesperado al verificar la sesión:', err);
        // Solo resetear si es un error de autenticación real
        if (err.message?.includes('JWT') || err.code === 'PGRST301') {
          clearCorruptedSession();
          setUser(null);
          setIsAdmin(false);
        }
        // Para otros errores, mantener el estado actual
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('Evento de autenticación:', event);
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
            // Solo navegar si no estamos ya en login
            if (window.location.pathname !== '/login') {
              navigate('/login');
            }
          } else if (session && event === 'SIGNED_IN') {
            console.log('SIGNED_IN - Usuario:', session.user.email);
            setUser(session.user);
            
            // Verificación directa por email (solución temporal)
            const isAdminEmail = session.user.email === 'jamroa67@gmail.com';
            console.log('SIGNED_IN - ¿Es email de admin?:', isAdminEmail);
            setIsAdmin(isAdminEmail);
            setLoading(false);
          } else if (session && event === 'TOKEN_REFRESHED') {
            console.log('TOKEN_REFRESHED - Usuario:', session.user.email);
            setUser(session.user);
            
            // Verificación directa por email (solución temporal)
            const isAdminEmail = session.user.email === 'jamroa67@gmail.com';
            console.log('TOKEN_REFRESHED - ¿Es email de admin?:', isAdminEmail);
            setIsAdmin(isAdminEmail);
            setLoading(false);
          } else if (session && event === 'INITIAL_SESSION') {
            console.log('INITIAL_SESSION en listener - Usuario:', session.user.email);
            setUser(session.user);
            
            // Verificación directa por email (solución temporal)
            const isAdminEmail = session.user.email === 'jamroa67@gmail.com';
            console.log('INITIAL_SESSION en listener - ¿Es email de admin?:', isAdminEmail);
            setIsAdmin(isAdminEmail);
            setLoading(false);
          } else {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error en el listener de autenticación:', err);
          // Solo resetear si es un error de autenticación real
          if (err.message?.includes('JWT') || err.code === 'PGRST301') {
            clearCorruptedSession();
            setUser(null);
            setIsAdmin(false);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Función para refrescar el token de autenticación
  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error al refrescar el token:', error);
        // Limpiar tokens corruptos y cerrar sesión
        clearCorruptedSession();
        await supabase.auth.signOut();
        return false;
      } else if (data.session) {
        console.log('Token refrescado correctamente');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error inesperado al refrescar el token:', err);
      // Limpiar tokens corruptos en caso de error inesperado
      clearCorruptedSession();
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
        // Si no se pudo refrescar, limpiar tokens corruptos y cerrar sesión
        clearCorruptedSession();
        await supabase.auth.signOut();
        return false;
      }
    }
    return false; // No es un error de autenticación
  };

  const value = {
    user,
    isAdmin,
    loading,
    refreshToken,
    handleAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}