import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';

const Calendario = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        // Obtener partidos ordenados por fecha
        const { data, error } = await supabase
          .from('games')
          .select(`
            id,
            date,
            status,
            place,
            score_team_a,
            score_team_b,
            team_a:team_a_id(id, team_name, logo_url),
            team_b:team_b_id(id, team_name, logo_url),
            winner_team:winner_team_id(id, team_name)
          `)
          .order('date', { ascending: true });

        if (error) throw error;
        
        setGames(data || []);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('No se pudieron cargar los partidos');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Obtener próximos partidos (pendientes o en progreso)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingGames = games
    .filter(game => {
      const gameDate = new Date(game.date);
      return (gameDate >= today && (game.status === 'pending' || game.status === 'in_progress'));
    })
    .slice(0, 2);

  // Agrupar partidos por fecha
  const gamesByDate = games.reduce((acc, game) => {
    const date = new Date(game.date).toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push(game);
    return acc;
  }, {});

  // Formatear estado del partido
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'completed': 'Finalizado',
      'postponed': 'Pospuesto',
      'in_progress': 'En Progreso'
    };
    return statusMap[status] || status;
  };

  if (loading) return <div className="text-center py-10">Cargando calendario...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Calendario de Partidos</h1>
      
      {/* Sección de próximos partidos */}
      {upcomingGames.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Próximos Partidos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingGames.map(game => (
              <Link 
                to={`/partido/${game.id}`} 
                key={game.id}
                className="block bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="p-6 text-white">
                  <div className="text-center mb-4">
                    <div className="text-sm opacity-90">
                      {new Date(game.date).toLocaleTimeString('es-DO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      <div className="text-xs opacity-75">
                        {game.place}
                      </div>
                    </div>
                    {game.status === 'in_progress' && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mt-2 inline-block animate-pulse">
                        🔴 EN VIVO
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      {game.team_a.logo_url ? (
                        <img 
                          src={game.team_a.logo_url} 
                          alt={game.team_a.team_name} 
                          className="w-16 h-16 object-contain mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold" translate="no">{game.team_a.team_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="font-semibold text-sm truncate max-w-20 sm:max-w-none" translate="no">{game.team_a.team_name}</div>
                    </div>
                    
                    <div className="text-center px-4">
                      {game.status === 'in_progress' ? (
                        <div className="text-2xl font-bold">
                          {game.score_team_a} - {game.score_team_b}
                        </div>
                      ) : (
                        <div className="text-xl font-bold opacity-75">VS</div>
                        
                      )}
                    </div>
                    
                    <div className="text-center flex-1">
                      {game.team_b.logo_url ? (
                        <img 
                          src={game.team_b.logo_url} 
                          alt={game.team_b.team_name} 
                          className="w-16 h-16 object-contain mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold" translate="no">{game.team_b.team_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="font-semibold text-sm truncate max-w-20 sm:max-w-none" translate="no">{game.team_b.team_name}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Calendario completo */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Todos los Partidos</h2>
        {Object.keys(gamesByDate).length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay partidos programados</p>
          </div>
        ) : (
          Object.entries(gamesByDate).map(([date, dateGames]) => (
            <div key={date} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 capitalize">{date}</h2>
              
              <div className="space-y-4">
                {dateGames.map(game => (
                  <Link 
                    to={`/partido/${game.id}`} 
                    key={game.id}
                    className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 sm:space-x-3">
                          <div className="flex flex-col items-center sm:flex-row sm:space-x-3">
                            {game.team_a.logo_url ? (
                              <img 
                                src={game.team_a.logo_url} 
                                alt={game.team_a.team_name} 
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs" translate="no">{game.team_a.team_name.substring(0, 2)}</span>
                              </div>
                            )}
                            <span className="font-semibold text-xs sm:text-base truncate max-w-20 sm:max-w-32 md:max-w-none mt-1 sm:mt-0" translate="no">{game.team_a.team_name}</span>
                          </div>
                        </div>
                        
                        {(game.status === 'completed' || game.status === 'in_progress') ? (
                          <div className="text-center">
                            <div className="text-xl font-bold">
                              {game.score_team_a} - {game.score_team_b}
                            </div>
                            {game.status === 'completed' && <div className="text-xs text-gray-500">Finalizado</div>}
                            {game.status === 'in_progress' && <div className="text-xs text-gray-500">Jugando ahora</div>}
                            {game.status === 'pending' && <div className="text-xs text-gray-500">{game.place}</div>}
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-gray-500">vs</div>
                            <div className="text-xs text-gray-500">
                              {new Date(game.date).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-3 sm:space-x-3">
                          <div className="flex flex-col items-center sm:flex-row sm:space-x-3">
                            <span className="font-semibold text-xs sm:text-base truncate max-w-20 sm:max-w-32 md:max-w-none mt-1 sm:mt-0 sm:order-1" translate="no">{game.team_b.team_name}</span>
                            {game.team_b.logo_url ? (
                              <img 
                                src={game.team_b.logo_url} 
                                alt={game.team_b.team_name} 
                                className="w-10 h-10 object-contain sm:order-2"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center sm:order-2">
                                <span className="text-xs" translate="no">{game.team_b.team_name.substring(0, 2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className={`inline-block px-2 py-1 rounded ${game.status === 'completed' ? 'bg-green-100 text-green-800' : game.status === 'postponed' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {getStatusText(game.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Calendario;