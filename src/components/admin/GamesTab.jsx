import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

const GamesTab = ({ handleAuthError }) => {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    team_a_id: '',
    team_b_id: '',
    status: 'pending',
    score_team_a: 0,
    score_team_b: 0
  });

  useEffect(() => {
    loadGames();
    loadTeams();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Error loading games:', err);
      setError(err.message);
      if (err.message.includes('JWT') || err.message.includes('token')) {
        handleAuthError();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name')
        .order('team_name');
      
      if (teamsError) throw teamsError;
      
      setTeams(teamsData || []);
    } catch (err) {
      console.error('Error loading teams:', err);
      if (err.message.includes('JWT') || err.message.includes('token')) {
        handleAuthError();
      }
    }
  };

  const handleNewGame = () => {
    setFormData({
      date: '',
      team_a_id: '',
      team_b_id: '',
      status: 'pending',
      score_team_a: 0,
      score_team_b: 0
    });
    setIsEditing(false);
    setFormError('');
    setShowModal(true);
  };

  const handleEditGame = (game) => {
    setFormData({
      id: game.id,
      date: game.date,
      team_a_id: game.team_a_id,
      team_b_id: game.team_b_id,
      status: game.status,
      score_team_a: game.score_team_a || 0,
      score_team_b: game.score_team_b || 0
    });
    setIsEditing(true);
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este partido?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);
      
      if (error) throw error;
      
      await loadGames();
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Error al eliminar el partido: ' + err.message);
      if (err.message.includes('JWT') || err.message.includes('token')) {
        handleAuthError();
      }
    }
  };

  const handleSubmitGame = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      // Validaciones
      if (!formData.date || !formData.team_a_id || !formData.team_b_id) {
        throw new Error('Todos los campos obligatorios deben ser completados');
      }

      if (formData.team_a_id === formData.team_b_id) {
        throw new Error('Los equipos deben ser diferentes');
      }

      // Determinar el ganador si el partido está completado
      let winnerTeamId = null;
      if (formData.status === 'completed') {
        const scoreA = parseInt(formData.score_team_a);
        const scoreB = parseInt(formData.score_team_b);
        
        if (scoreA > scoreB) {
          winnerTeamId = formData.team_a_id;
        } else if (scoreB > scoreA) {
          winnerTeamId = formData.team_b_id;
        }
        // Si es empate, winnerTeamId queda null
      }

      const gameData = {
        date: formData.date,
        team_a_id: formData.team_a_id,
        team_b_id: formData.team_b_id,
        status: formData.status,
        score_team_a: formData.status === 'completed' ? parseInt(formData.score_team_a) : null,
        score_team_b: formData.status === 'completed' ? parseInt(formData.score_team_b) : null,
        winner_team_id: winnerTeamId
      };

      let error;
      if (isEditing) {
        const result = await supabase
          .from('games')
          .update(gameData)
          .eq('id', formData.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('games')
          .insert([gameData]);
        error = result.error;
      }
      
      if (error) throw error;
      
      // Recargar la lista de partidos
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
      if (err.message.includes('JWT') || err.message.includes('token')) {
        handleAuthError();
      }
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

export default GamesTab;