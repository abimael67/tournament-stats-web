import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase/supabaseClient';

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

// Componente para gestionar equipos
const TeamsTab = ({ handleAuthError }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    team_name: '',
    church_name: '',
    logo_url: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('team_name');

        if (error) throw error;
        
        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('No se pudieron cargar los equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleEditTeam = (team) => {
    setFormData({
      id: team.id,
      team_name: team.team_name,
      church_name: team.church_name,
      logo_url: team.logo_url || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const deleteTeam = async () => {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);
        
        if (error) {
          // Verificar si es un error de autenticación
          const isAuthError = await handleAuthError(error);
          if (isAuthError) {
            // Reintentar después de refrescar el token
            return deleteTeam();
          }
          throw error;
        }
        
        // Actualizar la lista de equipos
        setTeams(teams.filter(team => team.id !== teamId));
      };
      
      // Ejecutar la función de eliminar
      await deleteTeam();
      
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('No se pudo eliminar el equipo. Inténtalo de nuevo.');
    }
  };

  const handleSubmitTeam = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    
    try {
      const saveTeam = async () => {
        if (isEditing) {
          // Actualizar equipo existente
          const { data, error } = await supabase
            .from('teams')
            .update({
              team_name: formData.team_name,
              church_name: formData.church_name,
              logo_url: formData.logo_url || null
            })
            .eq('id', formData.id)
            .select();
          
          if (error) {
            // Verificar si es un error de autenticación
            const isAuthError = await handleAuthError(error);
            if (isAuthError) {
              // Reintentar después de refrescar el token
              return saveTeam();
            }
            throw error;
          }
          
          // Actualizar la lista de equipos
          setTeams(teams.map(team => team.id === formData.id ? data[0] : team));
        } else {
          // Crear nuevo equipo
          const { data, error } = await supabase
            .from('teams')
            .insert([{
              team_name: formData.team_name,
              church_name: formData.church_name,
              logo_url: formData.logo_url || null
            }])
            .select();
          
          if (error) {
            // Verificar si es un error de autenticación
            const isAuthError = await handleAuthError(error);
            if (isAuthError) {
              // Reintentar después de refrescar el token
              return saveTeam();
            }
            throw error;
          }
          
          // Actualizar la lista de equipos
          setTeams([...teams, data[0]]);
        }
      };
      
      // Ejecutar la función de guardar
      await saveTeam();
      
      // Cerrar el modal y limpiar el formulario
      setShowModal(false);
      setFormData({ id: null, team_name: '', church_name: '', logo_url: '' });
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error saving team:', err);
      setFormError(`No se pudo ${isEditing ? 'actualizar' : 'crear'} el equipo. Inténtalo de nuevo.`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Cargando equipos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Equipos</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nuevo Equipo
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Iglesia</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No hay equipos registrados
                </td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={team.team_name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">{team.team_name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.church_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditTeam(team)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para crear/editar equipo */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
                </h3>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ id: null, team_name: '', church_name: '', logo_url: '' });
                    setIsEditing(false);
                    setFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmitTeam}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="team_name">
                    Nombre del Equipo <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="team_name"
                    type="text"
                    value={formData.team_name}
                    onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="church_name">
                    Nombre de la Iglesia <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="church_name"
                    type="text"
                    value={formData.church_name}
                    onChange={(e) => setFormData({...formData, church_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="logo_url">
                    URL del Logo
                  </label>
                  <input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ id: null, team_name: '', church_name: '', logo_url: '' });
                      setIsEditing(false);
                      setFormError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {formLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para gestionar partidos
const GamesTab = () => {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    date: '',
    team_a_id: '',
    team_b_id: '',
    status: 'pending',
    score_team_a: '',
    score_team_b: '',
    winner_team_id: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar partidos
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            id,
            date,
            status,
            score_team_a,
            score_team_b,
            team_a_id,
            team_b_id,
            winner_team_id,
            team_a:team_a_id(id, team_name),
            team_b:team_b_id(id, team_name),
            winner_team:winner_team_id(id, team_name)
          `)
          .order('date', { ascending: false });

        if (gamesError) throw gamesError;
        
        // Cargar equipos
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name')
          .order('team_name');

        if (teamsError) throw teamsError;
        
        setGames(gamesData || []);
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewGame = () => {
    setFormData({
      id: null,
      date: '',
      team_a_id: '',
      team_b_id: '',
      status: 'pending',
      score_team_a: '',
      score_team_b: '',
      winner_team_id: ''
    });
    setIsEditing(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleEditGame = (game) => {
    setFormData({
      id: game.id,
      date: game.date.split('T')[0], // Formato YYYY-MM-DD
      team_a_id: game.team_a_id,
      team_b_id: game.team_b_id,
      status: game.status,
      score_team_a: game.score_team_a || '',
      score_team_b: game.score_team_b || '',
      winner_team_id: game.winner_team_id || ''
    });
    setIsEditing(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);
      
      if (error) throw error;
      
      setGames(games.filter(game => game.id !== gameId));
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Error al eliminar el partido');
    }
  };

  const handleSubmitGame = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    
    try {
      // Validaciones
      if (!formData.date || !formData.team_a_id || !formData.team_b_id) {
        throw new Error('Fecha y equipos son obligatorios');
      }
      
      if (formData.team_a_id === formData.team_b_id) {
        throw new Error('Los equipos deben ser diferentes');
      }
      
      // Determinar ganador si el partido está completado
      let winner_team_id = null;
      if (formData.status === 'completed' && formData.score_team_a && formData.score_team_b) {
        const scoreA = parseInt(formData.score_team_a);
        const scoreB = parseInt(formData.score_team_b);
        if (scoreA > scoreB) {
          winner_team_id = formData.team_a_id;
        } else if (scoreB > scoreA) {
          winner_team_id = formData.team_b_id;
        }
      }
      
      const gameData = {
        date: formData.date,
        team_a_id: formData.team_a_id,
        team_b_id: formData.team_b_id,
        status: formData.status,
        score_team_a: formData.status === 'completed' ? parseInt(formData.score_team_a) || null : null,
        score_team_b: formData.status === 'completed' ? parseInt(formData.score_team_b) || null : null,
        winner_team_id
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', formData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('games')
          .insert([gameData]);
        
        if (error) throw error;
      }
      
      // Recargar datos
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          date,
          status,
          score_team_a,
          score_team_b,
          team_a_id,
          team_b_id,
          winner_team_id,
          team_a:team_a_id(id, team_name),
          team_b:team_b_id(id, team_name),
          winner_team:winner_team_id(id, team_name)
        `)
        .order('date', { ascending: false });
      
      if (gamesError) throw gamesError;
      
      setGames(gamesData || []);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving game:', err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Cargando partidos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Partidos</h2>
        <button 
          onClick={handleNewGame}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nuevo Partido
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {games.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No hay partidos registrados
                </td>
              </tr>
            ) : (
              games.map(game => (
                <tr key={game.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(game.date).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {game.team_a.team_name} vs {game.team_b.team_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      game.status === 'completed' ? 'bg-green-100 text-green-800' :
                      game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {game.status === 'completed' ? 'Completado' :
                       game.status === 'in_progress' ? 'En Progreso' :
                       'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.status === 'completed' ? 
                      `${game.score_team_a} - ${game.score_team_b}` : 
                      '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditGame(game)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para crear/editar partido */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Editar Partido' : 'Nuevo Partido'}
              </h3>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmitGame} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipo A *
                  </label>
                  <select
                    value={formData.team_a_id}
                    onChange={(e) => setFormData({...formData, team_a_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar equipo</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.team_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipo B *
                  </label>
                  <select
                    value={formData.team_b_id}
                    onChange={(e) => setFormData({...formData, team_b_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar equipo</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.team_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                
                {formData.status === 'completed' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Goles Equipo A
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.score_team_a}
                          onChange={(e) => setFormData({...formData, score_team_a: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Goles Equipo B
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.score_team_b}
                          onChange={(e) => setFormData({...formData, score_team_b: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para gestionar jugadores
const PlayersTab = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    age: '',
    jersey_number: '',
    role: 'player',
    profile_pic_url: '',
    team_id: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar jugadores
        const { data: playersData, error: playersError } = await supabase
          .from('members')
          .select(`
            id,
            name,
            age,
            jersey_number,
            role,
            profile_pic_url,
            team_id,
            team:team_id(id, team_name)
          `)
          .order('name');

        if (playersError) throw playersError;
        
        // Cargar equipos para el selector
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name')
          .order('team_name');

        if (teamsError) throw teamsError;
        
        setPlayers(playersData || []);
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewPlayer = () => {
    setFormData({
      id: null,
      name: '',
      age: '',
      jersey_number: '',
      role: 'player',
      profile_pic_url: '',
      team_id: ''
    });
    setIsEditing(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleEditPlayer = (player) => {
    setFormData({
      id: player.id,
      name: player.name,
      age: player.age || '',
      jersey_number: player.jersey_number || '',
      role: player.role,
      profile_pic_url: player.profile_pic_url || '',
      team_id: player.team_id || ''
    });
    setIsEditing(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este jugador? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', playerId);
      
      if (error) throw error;
      
      // Actualizar la lista de jugadores
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (err) {
      console.error('Error deleting player:', err);
      alert('No se pudo eliminar el jugador. Inténtalo de nuevo.');
    }
  };

  const handleSubmitPlayer = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    
    try {
      // Validaciones
      if (!formData.name.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      
      const playerData = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        role: formData.role,
        profile_pic_url: formData.profile_pic_url || null,
        team_id: formData.team_id || null
      };
      
      if (isEditing) {
        // Actualizar jugador existente
        const { error } = await supabase
          .from('members')
          .update(playerData)
          .eq('id', formData.id);
        
        if (error) throw error;
      } else {
        // Crear nuevo jugador
        const { error } = await supabase
          .from('members')
          .insert([playerData]);
        
        if (error) throw error;
      }
      
      // Recargar datos
      const { data: playersData, error: playersError } = await supabase
        .from('members')
        .select(`
          id,
          name,
          age,
          jersey_number,
          role,
          profile_pic_url,
          team_id,
          team:team_id(id, team_name)
        `)
        .order('name');
      
      if (playersError) throw playersError;
      
      setPlayers(playersData || []);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving player:', err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Cargando jugadores...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Jugadores</h2>
        <button 
          onClick={handleNewPlayer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nuevo Jugador
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No hay jugadores registrados
                </td>
              </tr>
            ) : (
              players.map(player => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {player.profile_pic_url ? (
                          <img 
                            src={player.profile_pic_url} 
                            alt={player.name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">{player.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.team?.team_name || 'Sin equipo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.jersey_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {player.role === 'player' ? 'Jugador' : player.role === 'coach' ? 'Entrenador' : 'Asistente'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      onClick={() => handleEditPlayer(player)}
                    >
                      Editar
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para crear/editar jugador */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
              </h3>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmitPlayer}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Equipo
                  </label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Sin equipo</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.team_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Número de Camiseta
                  </label>
                  <input
                    type="number"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({...formData, jersey_number: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="1"
                    max="99"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="player">Jugador</option>
                    <option value="coach">Entrenador</option>
                    <option value="assistant">Asistente</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    URL de Foto de Perfil
                  </label>
                  <input
                    type="url"
                    value={formData.profile_pic_url}
                    onChange={(e) => setFormData({...formData, profile_pic_url: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  >
                    {formLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para gestionar estadísticas
const StatsTab = ({ handleAuthError }) => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select(`
            id,
            date,
            team_a:team_a_id(id, team_name),
            team_b:team_b_id(id, team_name)
          `)
          .order('date', { ascending: false });

        if (error) throw error;
        
        setGames(data || []);
        if (data && data.length > 0) {
          setSelectedGame(data[0].id);
          await fetchGameStats(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('No se pudieron cargar los partidos');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const fetchGameStats = async (gameId) => {
    if (!gameId) return;
    
    try {
      const { data, error } = await supabase
        .from('stats')
        .select(`
          id,
          points,
          rebounds,
          assists,
          technical_fouls,
          field_goal_attempts,
          field_goal_made,
          three_point_attempts,
          three_point_made,
          free_throw_attempts,
          free_throw_made,
          player:member_id(id, name, jersey_number)
        `)
        .eq('game_id', gameId)
        .order('points', { ascending: false });

      if (error) throw error;
      
      setStats(data || []);
    } catch (err) {
      console.error('Error fetching game stats:', err);
      setError('No se pudieron cargar las estadísticas');
    }
  };

  const handleGameChange = async (e) => {
    const gameId = e.target.value;
    setSelectedGame(gameId);
    await fetchGameStats(gameId);
  };
  
  // Función para eliminar una estadística
  const handleDeleteStat = async (statId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta estadística? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const deleteStat = async () => {
        const { error } = await supabase
          .from('stats')
          .delete()
          .eq('id', statId);
        
        if (error) {
          // Verificar si es un error de autenticación
          const isAuthError = await handleAuthError(error);
          if (isAuthError) {
            // Reintentar después de refrescar el token
            return deleteStat();
          }
          throw error;
        }
        
        // Actualizar la lista de estadísticas
        setStats(stats.filter(stat => stat.id !== statId));
      };
      
      // Ejecutar la función de eliminar
      await deleteStat();
      
    } catch (err) {
      console.error('Error deleting stat:', err);
      alert('No se pudo eliminar la estadística. Inténtalo de nuevo.');
    }
  };

  if (loading && games.length === 0) return <div className="text-center py-10">Cargando partidos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Estadísticas</h2>
        <button 
          onClick={() => setShowStatsModal(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Registrar Estadísticas
        </button>
      </div>
      
      {games.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay partidos registrados</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="game-select" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Partido
            </label>
            <select
              id="game-select"
              value={selectedGame || ''}
              onChange={handleGameChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {games.map(game => (
                <option key={game.id} value={game.id}>
                  {new Date(game.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })} - {game.team_a.team_name} vs {game.team_b.team_name}
                </option>
              ))}
            </select>
          </div>
          
          {loading ? (
            <div className="text-center py-10">Cargando estadísticas...</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay estadísticas registradas para este partido</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REB</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AST</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FG</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3PT</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FT</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.map(stat => (
                    <tr key={stat.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.player.name} ({stat.player.jersey_number})
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.points}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.rebounds}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.assists}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.field_goal_made}/{stat.field_goal_attempts}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.three_point_made}/{stat.three_point_attempts}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.free_throw_made}/{stat.free_throw_attempts}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.technical_fouls}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteStat(stat.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Modal para registrar estadísticas */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Registrar Estadísticas</h3>
                <button 
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <StatsForm 
                gameId={selectedGame} 
                onSuccess={() => {
                  setShowStatsModal(false);
                  fetchGameStats(selectedGame);
                }}
                onCancel={() => setShowStatsModal(false)}
                handleAuthError={handleAuthError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para el formulario de estadísticas
const StatsForm = ({ gameId, onSuccess, onCancel, handleAuthError }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    member_id: '',
    points: 0,
    rebounds: 0,
    assists: 0,
    technical_fouls: 0,
    field_goal_attempts: 0,
    field_goal_made: 0,
    three_point_attempts: 0,
    three_point_made: 0,
    free_throw_attempts: 0,
    free_throw_made: 0
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        
        // Primero obtenemos el partido para saber qué equipos participan
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('team_a_id, team_b_id')
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;
        
        // Luego obtenemos los jugadores de ambos equipos
        const { data: playersData, error: playersError } = await supabase
          .from('members')
          .select('id, name, jersey_number, team_id, team:team_id(team_name)')
          .in('team_id', [gameData.team_a_id, gameData.team_b_id])
          .order('name');

        if (playersError) throw playersError;
        
        setPlayers(playersData || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('No se pudieron cargar los jugadores');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [gameId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const saveStats = async () => {
        const { data, error } = await supabase
          .from('stats')
          .insert([{
            game_id: gameId,
            member_id: formData.member_id,
            points: formData.points,
            rebounds: formData.rebounds,
            assists: formData.assists,
            technical_fouls: formData.technical_fouls,
            field_goal_attempts: formData.field_goal_attempts,
            field_goal_made: formData.field_goal_made,
            three_point_attempts: formData.three_point_attempts,
            three_point_made: formData.three_point_made,
            free_throw_attempts: formData.free_throw_attempts,
            free_throw_made: formData.free_throw_made
          }])
          .select();
        
        if (error) {
          // Verificar si es un error de autenticación
          const isAuthError = await handleAuthError(error);
          if (isAuthError) {
            // Reintentar después de refrescar el token
            return saveStats();
          }
          throw error;
        }
        
        return data;
      };
      
      // Ejecutar la función de guardar
      await saveStats();
      
      // Resetear el formulario
      setFormData({
        member_id: '',
        points: 0,
        rebounds: 0,
        assists: 0,
        technical_fouls: 0,
        field_goal_attempts: 0,
        field_goal_made: 0,
        three_point_attempts: 0,
        three_point_made: 0,
        free_throw_attempts: 0,
        free_throw_made: 0
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error registering stats:', err);
      setError('No se pudieron registrar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading && players.length === 0) {
    return <div className="text-center py-4">Cargando jugadores...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="member_id">
          Jugador <span className="text-red-600">*</span>
        </label>
        <select
          id="member_id"
          value={formData.member_id}
          onChange={(e) => setFormData({...formData, member_id: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Seleccionar jugador</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.name} (#{player.jersey_number}) - {player.team.team_name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="points">
            Puntos
          </label>
          <input
            id="points"
            type="number"
            min="0"
            value={formData.points}
            onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="rebounds">
            Rebotes
          </label>
          <input
            id="rebounds"
            type="number"
            min="0"
            value={formData.rebounds}
            onChange={(e) => setFormData({...formData, rebounds: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Guardando...' : 'Guardar Estadísticas'}
        </button>
      </div>
    </form>
  );
};

export default Admin;