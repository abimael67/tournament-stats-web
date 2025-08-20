import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';

const Home = () => {
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingGames();
  }, []);

  const fetchUpcomingGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          date,
          status,
          score_team_a,
          score_team_b,
          team_a:team_a_id(id, team_name, logo_url),
          team_b:team_b_id(id, team_name, logo_url)
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      // Filtrar próximos partidos
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = data
        .filter(game => {
          const gameDate = new Date(game.date + 'T00:00:00');
          return (gameDate >= today && (game.status === 'pending' || game.status === 'in_progress'));
        })
        .slice(0, 2);

      setUpcomingGames(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Torneo de Baloncesto entre Iglesias Adventistas de Santiago</h1>
        <p className="text-xl text-gray-600">Estadísticas, calendario y más información sobre el torneo</p>
                <p className="text-xl text-gray-600">Torneo benefico organizado por la Iglesia Adventista del Séptimo Día "Libertad"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/calendario" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Calendario</h2>
          <p className="text-gray-600">Consulta los próximos partidos y resultados anteriores</p>
        </Link>

        <Link to="/equipos" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Equipos</h2>
          <p className="text-gray-600">Conoce los equipos participantes y sus jugadores</p>
        </Link>

        <Link to="/jugadores" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Jugadores</h2>
          <p className="text-gray-600">Busca jugadores y consulta sus estadísticas</p>
        </Link>

        <Link to="/standings" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Standings</h2>
          <p className="text-gray-600">Tabla de posiciones actualizada</p>
        </Link>
      </div>

      {/* Sección de próximos partidos */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">Próximos Partidos</h2>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando próximos partidos...</p>
          </div>
        ) : upcomingGames.length > 0 ? (
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
                      {new Date(game.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
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
                          <span className="text-lg font-bold">{game.team_a.team_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="font-semibold text-sm">{game.team_a.team_name}</div>
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
                          <span className="text-lg font-bold">{game.team_b.team_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="font-semibold text-sm">{game.team_b.team_name}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay próximos partidos programados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;