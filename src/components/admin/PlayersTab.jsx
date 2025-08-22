import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';
import { getPositionName } from '../../utils';

const PlayersTab = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    age: '',
    jersey_number: '',
    role: 'player',
    profile_pic_url: '',
    team_id: '',
    inactive: false,
    position: ''
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
            inactive,
            position,
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
      team_id: '',
      inactive: false,
      position: ''
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
      team_id: player.team_id || '',
      inactive: player.inactive || false,
      position: player.position
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
        team_id: formData.team_id || null,
        inactive: formData.inactive,
        position: formData.position
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
          inactive,
          position,
          team:team_id(id, team_name)
        `)
        .order('name');
      
      if (playersError) throw playersError;
      
      setPlayers(playersData || []);
      
      // Resetear formulario y cerrar modal
      setFormData({
        id: null,
        name: '',
        age: '',
        jersey_number: '',
        role: 'player',
        profile_pic_url: '',
        team_id: '',
        inactive: false,
        position: ''
      });
      setIsEditing(false);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving player:', err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Filtrar jugadores por equipo seleccionado
  const filteredPlayers = selectedTeamFilter 
    ? players.filter(player => player.team_id === selectedTeamFilter)
    : players;

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
      
      {/* Filtro de equipos */}
      <div className="mb-6">
        <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por equipo:
        </label>
        <select
          id="team-filter"
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los equipos</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.team_name}
            </option>
          ))}
        </select>
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {selectedTeamFilter ? 'No hay jugadores en este equipo' : 'No hay jugadores registrados'}
                </td>
              </tr>
            ) : (
              filteredPlayers.map(player => (
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
                            <span className="text-xs font-medium text-blue-800" translate="no">{player.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900" translate="no">{player.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span translate="no">{player.team?.team_name || 'Sin equipo'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.jersey_number || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {player.role === 'player' ? 'Jugador' : player.role === 'coach' ? 'Entrenador' : 'Asistente'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPositionName(player.position) || '-'}
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
                    min="0"
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

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Posición
                  </label>
                  <select 
                   value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 >
                  <option value="">Sin posición</option>
                  <option value="point_guard">Base</option>
                  <option value="shooting_guard">Escolta</option>
                  <option value="small_forward">Alero</option>
                  <option value="power_forward">Alero de poder</option>
                  <option value="center">Pívot</option>
                 </select>
                </div>
                
                <div className="mb-4">
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
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.inactive}
                      onChange={(e) => setFormData({...formData, inactive: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 text-sm font-bold">
                      Jugador Inactivo
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Marcar si el jugador no está disponible para jugar
                  </p>
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

export default PlayersTab;