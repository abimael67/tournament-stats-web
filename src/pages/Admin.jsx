import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase/supabaseClient';
import TeamsTab from '../components/admin/TeamsTab';
import GamesTab from '../components/admin/GamesTab';
import PlayersTab from '../components/admin/PlayersTab';
import StatsTab from '../components/admin/StatsTab';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('games');

  // Función para manejar errores de autenticación
  const handleAuthError = async (error) => {
    if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        return true; // Indica que se debe reintentar la operación
      } catch (refreshError) {
        console.error('Error refreshing session:', refreshError);
        // Redirigir al login si no se puede refrescar
        window.location.href = '/login';
        return false;
      }
    }
    return false; // No es un error de autenticación
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Panel de Administración</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs de navegación */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('games')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'games' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Partidos
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'teams' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Equipos
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'players' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Jugadores
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Estadísticas
            </button>
          </nav>
        </div>

        {/* Contenido de cada tab */}
        <div className="p-6">
          {activeTab === 'games' && <GamesTab handleAuthError={handleAuthError} />}
          {activeTab === 'teams' && <TeamsTab handleAuthError={handleAuthError} />}
          {activeTab === 'players' && <PlayersTab handleAuthError={handleAuthError} />}
          {activeTab === 'stats' && <StatsTab handleAuthError={handleAuthError} />}
        </div>
      </div>
    </div>
  );
};

export default Admin;