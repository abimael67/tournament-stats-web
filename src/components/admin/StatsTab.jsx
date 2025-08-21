import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

const StatsForm = ({ gameId, onSuccess, onCancel, handleAuthError, editingStat = null }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    member_id: editingStat?.member_id || '',
    points: editingStat?.points || 0,
    rebounds: editingStat?.rebounds || 0,
    assists: editingStat?.assists || 0,
    technical_fouls: editingStat?.technical_fouls || 0,
    fouls: editingStat?.fouls || 0,
    steals: editingStat?.steals || 0,
    field_goal_attempts: editingStat?.field_goal_attempts || 0,
    field_goal_made: editingStat?.field_goal_made || 0,
    three_point_attempts: editingStat?.three_point_attempts || 0,
    three_point_made: editingStat?.three_point_made || 0,
    free_throw_attempts: editingStat?.free_throw_attempts || 0,
    free_throw_made: editingStat?.free_throw_made || 0
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
        if (err.message.includes('JWT') || err.message.includes('token')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [gameId, handleAuthError]);

  // Resetear el formulario cuando cambie la estadística que se está editando
  useEffect(() => {
    if (editingStat) {
      setFormData({
        member_id: editingStat.member_id || '',
        points: editingStat.points || 0,
        rebounds: editingStat.rebounds || 0,
        assists: editingStat.assists || 0,
        steals: editingStat.steals || 0,
        technical_fouls: editingStat.technical_fouls || 0,
        fouls: editingStat.fouls || 0,
        field_goal_attempts: editingStat.field_goal_attempts || 0,
        field_goal_made: editingStat.field_goal_made || 0,
        three_point_attempts: editingStat.three_point_attempts || 0,
        three_point_made: editingStat.three_point_made || 0,
        free_throw_attempts: editingStat.free_throw_attempts || 0,
        free_throw_made: editingStat.free_throw_made || 0
      });
    } else {
      setFormData({
        member_id: '',
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        technical_fouls: 0,
        fouls: 0,
        field_goal_attempts: 0,
        field_goal_made: 0,
        three_point_attempts: 0,
        three_point_made: 0,
        free_throw_attempts: 0,
        free_throw_made: 0
      });
    }
  }, [editingStat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const saveStats = async () => {
        const statsData = {
          game_id: gameId,
          member_id: formData.member_id,
          points: formData.points,
          rebounds: formData.rebounds,
          assists: formData.assists,
          steals: formData.steals,
          technical_fouls: formData.technical_fouls,
          fouls: formData.fouls,
          field_goal_attempts: formData.field_goal_attempts,
          field_goal_made: formData.field_goal_made,
          three_point_attempts: formData.three_point_attempts,
          three_point_made: formData.three_point_made,
          free_throw_attempts: formData.free_throw_attempts,
          free_throw_made: formData.free_throw_made
        };

        let data, error;
        
        if (editingStat) {
          // Actualizar estadística existente
          ({ data, error } = await supabase
            .from('stats')
            .update(statsData)
            .eq('id', editingStat.id)
            .select());
        } else {
          // Crear nueva estadística
          ({ data, error } = await supabase
            .from('stats')
            .insert([statsData])
            .select());
        }
        
        if (error) {
          // Verificar si es un error de autenticación
          if (error.message.includes('JWT') || error.message.includes('token')) {
            handleAuthError();
            return;
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
        steals: 0,
        technical_fouls: 0,
        fouls: 0,
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
      
      <div className="grid grid-cols-4 gap-4 mb-4">
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
         <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="assists">
            Asistencias
          </label>
          <input
            id="assists"
            type="number"
            min="0"
            value={formData.assists}
            onChange={(e) => setFormData({...formData, assists: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
          <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="steals">
            Robos
          </label>
          <input
            id="steals"
            type="number"
            min="0"
            value={formData.steals}
            onChange={(e) => setFormData({...formData, steals: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
       <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="field_goal_attempts">
            Intentos de 2P
          </label>
          <input
            id="field_goal_attempts"
            type="number"
            min="0"
            value={formData.field_goal_attempts}
            onChange={(e) => setFormData({...formData, field_goal_attempts: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="field_goal_made">
            2P Anotados
          </label>
          <input
            id="field_goal_made"
            type="number"
            min="0"
            value={formData.field_goal_made}
            onChange={(e) => setFormData({...formData, field_goal_made: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="three_point_attempts">
            Intentos de 3P
          </label>
          <input
            id="three_point_attempts"
            type="number"
            min="0"
            value={formData.three_point_attempts}
            onChange={(e) => setFormData({...formData, three_point_attempts: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="three_point_made">
            3P Anotados
          </label>
          <input
            id="three_point_made"
            type="number"
            min="0"
            value={formData.three_point_made}
            onChange={(e) => setFormData({...formData, three_point_made: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
       <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="free_throw_attempts">
            Intentos de tiro libre
          </label>
          <input
            id="steals"
            type="number"
            min="0"
            value={formData.free_throw_attempts}
            onChange={(e) => setFormData({...formData, free_throw_attempts: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="free_throw_made">
            Tiro libre marcado
          </label>
          <input
            id="free_throw_made"
            type="number"
            min="0"
            value={formData.free_throw_made}
            onChange={(e) => setFormData({...formData, free_throw_made: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="technical_fouls">
            Faltas tecnicas
          </label>
          <input
            id="technical_fouls"
            type="number"
            min="0"
            value={formData.technical_fouls}
            onChange={(e) => setFormData({...formData, technical_fouls: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="personal_fouls">
            Faltas personales
          </label>
          <input
            id="fouls"
            type="number"
            min="0"
            value={formData.fouls}
            onChange={(e) => setFormData({...formData, fouls: parseInt(e.target.value) || 0})}
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

const StatsTab = ({ handleAuthError }) => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingStat, setEditingStat] = useState(null);

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
        if (err.message.includes('JWT') || err.message.includes('token')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [handleAuthError]);

  const fetchGameStats = async (gameId) => {
    if (!gameId) return;
    
    try {
      // Obtener información del juego
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          id,
          team_a:team_a_id(id, team_name),
          team_b:team_b_id(id, team_name)
        `)
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setSelectedGameData(gameData);

      // Obtener estadísticas con información del equipo
      const { data, error } = await supabase
        .from('stats')
        .select(`
          id,
          points,
          rebounds,
          assists,
          technical_fouls,
          fouls,
          steals,
          field_goal_attempts,
          field_goal_made,
          three_point_attempts,
          three_point_made,
          free_throw_attempts,
          free_throw_made,
          member_id,
          player:member_id(id, name, jersey_number, team_id)
        `)
        .eq('game_id', gameId)
        .order('points', { ascending: false });

      if (error) throw error;
      
      setStats(data || []);
    } catch (err) {
      console.error('Error fetching game stats:', err);
      setError('No se pudieron cargar las estadísticas');
      if (err.message.includes('JWT') || err.message.includes('token')) {
        handleAuthError();
      }
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
          if (error.message.includes('JWT') || error.message.includes('token')) {
            handleAuthError();
            return;
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

  // Función para editar una estadística
  const handleEditStat = (stat) => {
    // Pre-llenar el formulario con los datos del jugador y estadísticas
    const editingStatWithMemberId = {
      ...stat,
      member_id: stat.member_id || stat.player?.id
    };
    setEditingStat(editingStatWithMemberId);
    setShowStatsModal(true);
  };

  if (loading && games.length === 0) return <div className="text-center py-10">Cargando partidos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Estadísticas</h2>
        <button 
          onClick={() => {
            setEditingStat(null);
            setShowStatsModal(true);
          }} 
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
                  {new Date(game.date).toLocaleString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })} - {game.team_a.team_name} vs {game.team_b.team_name}
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
            <div className="space-y-8">
              {selectedGameData && (
                <>
                  {/* Tabla del Equipo A */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedGameData.team_a.team_name}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REB</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AST</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FG</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3PT</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TL</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ST</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id).length === 0 ? (
                            <tr>
                              <td colSpan="10" className="px-3 py-4 text-center text-gray-500">
                                No hay estadísticas registradas para este equipo
                              </td>
                            </tr>
                          ) : (
                            stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id).map(stat => (
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
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.fouls}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.technical_fouls}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.steals}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleEditStat(stat)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                  >
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
                            ))
                          )}
                        </tbody>
                         <tfoot className="bg-blue-100">
                           <tr className="font-semibold">
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL EQUIPO</td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.points || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.rebounds || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.assists || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.field_goal_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.field_goal_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.three_point_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.three_point_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.free_throw_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.free_throw_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.fouls || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.technical_fouls || 0), 0)}
                             </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_a.id)
                                 .reduce((sum, stat) => sum + (stat.steals || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                           </tr>
                         </tfoot>
                       </table>
                     </div>
                   </div>

                   {/* Tabla del Equipo B */}
                   <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedGameData.team_b.team_name}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-green-50">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REB</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AST</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FG</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3PT</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TL</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TF</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ST</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id).length === 0 ? (
                            <tr>
                              <td colSpan="10" className="px-3 py-4 text-center text-gray-500">
                                No hay estadísticas registradas para este equipo
                              </td>
                            </tr>
                          ) : (
                            stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id).map(stat => (
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
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.fouls}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.technical_fouls}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{stat.steals}</td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleEditStat(stat)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                  >
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
                            ))
                          )}
                        </tbody>
                         <tfoot className="bg-green-100">
                           <tr className="font-semibold">
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL EQUIPO</td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.points || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.rebounds || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.assists || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.field_goal_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.field_goal_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.three_point_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.three_point_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.free_throw_made || 0), 0)}/
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.free_throw_attempts || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.fouls || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.technical_fouls || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                               {stats.filter(stat => stat.player.team_id === selectedGameData.team_b.id)
                                 .reduce((sum, stat) => sum + (stat.steals || 0), 0)}
                             </td>
                             <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                           </tr>
                         </tfoot>
                       </table>
                     </div>
                   </div>
                 </>
               )}
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingStat ? 'Editar Estadísticas' : 'Registrar Estadísticas'}
                </h3>
                <button 
                  onClick={() => {
                    setShowStatsModal(false);
                    setEditingStat(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <StatsForm 
                gameId={selectedGame} 
                editingStat={editingStat}
                onSuccess={() => {
                  setShowStatsModal(false);
                  setEditingStat(null);
                  fetchGameStats(selectedGame);
                }}
                onCancel={() => {
                  setShowStatsModal(false);
                  setEditingStat(null);
                }}
                handleAuthError={handleAuthError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;