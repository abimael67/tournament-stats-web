import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import TeamsTab from '../components/admin/TeamsTab';
import GamesTab from '../components/admin/GamesTab';
import PlayersTab from '../components/admin/PlayersTab';
import StatsTab from '../components/admin/StatsTab';

import DebugProfiles from '../components/DebugProfiles';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('games');
  const navigate = useNavigate();
  const { user, profile, loading, isAdmin, signOut } = useAuth();

  // Verificar autenticación
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Verificando autenticación...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
          <p>No tienes permisos de administrador para acceder a esta página.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">Panel de Administración</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Bienvenido, {profile?.full_name || user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      
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
          {activeTab === 'games' && <GamesTab />}
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'players' && <PlayersTab />}
          {activeTab === 'stats' && <StatsTab />}
        </div>
      </div>
      
      {/* Componente de debugging */}
       <div className="mt-8">
         <DebugProfiles />
       </div>
    </div>
  );
};

export default Admin;