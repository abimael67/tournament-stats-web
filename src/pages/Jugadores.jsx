import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';
import { getPositionName } from '../utils';

const Jugadores = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        
        // Obtener jugadores con información de equipo
        const { data, error } = await supabase
          .from('members')
          .select(`
            id,
            name,
            age,
            jersey_number,
            role,
            profile_pic_url,
            position,
            team:team_id(id, team_name, church_name)
          `)
          .eq('role', 'player')
          .order('name');

        if (error) throw error;
        
        setPlayers(data || []);
        setFilteredPlayers(data || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('No se pudieron cargar los jugadores');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Filtrar jugadores por término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlayers(players);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(term) || 
      player.team.team_name.toLowerCase().includes(term)
    );
    
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  if (loading) return <div className="text-center py-10">Cargando jugadores...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Jugadores</h1>
      
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron jugadores con ese criterio' : 'No hay jugadores registrados'}
            </p>
          </div>
        ) : (
          filteredPlayers.map(player => (
            <Link 
              to={`/jugador/${player.id}`} 
              key={player.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
                {player.profile_pic_url ? (
                  <img 
                    src={player.profile_pic_url} 
                    alt={player.name} 
                    className="h-full w-auto object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-800">{player.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-blue-700">{player.name}</h2>
                    <p className="text-gray-600">{player.team.team_name}</p>
                  </div>
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {player.jersey_number}
                  </div>
                </div>
                
                {player.position && (
                  <p className="text-sm text-gray-500 mt-2">{getPositionName(player.position)}</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-3 text-center text-sm text-blue-600 font-medium">
                Ver perfil y estadísticas
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Jugadores;