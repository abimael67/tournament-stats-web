import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        
        // Obtener equipos
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_name, logo_url');

        if (teamsError) throw teamsError;
        
        // Obtener partidos completados
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('team_a_id, team_b_id, winner_team_id, score_team_a, score_team_b')
          .eq('status', 'completed');

        if (gamesError) throw gamesError;
        
        // Calcular estadísticas para cada equipo
        const teamStats = teams.map(team => {
          const teamGames = games.filter(game => 
            game.team_a_id === team.id || game.team_b_id === team.id
          );
          
          const wins = teamGames.filter(game => game.winner_team_id === team.id).length;
          const losses = teamGames.length - wins;
          
          // Calcular puntos a favor y en contra
          let pointsScored = 0;
          let pointsAgainst = 0;
          
          teamGames.forEach(game => {
            if (game.team_a_id === team.id) {
              pointsScored += game.score_team_a || 0;
              pointsAgainst += game.score_team_b || 0;
            } else {
              pointsScored += game.score_team_b || 0;
              pointsAgainst += game.score_team_a || 0;
            }
          });
          
          return {
            ...team,
            games_played: teamGames.length,
            wins,
            losses,
            win_percentage: teamGames.length > 0 ? (wins / teamGames.length) : 0,
            points_scored: pointsScored,
            points_against: pointsAgainst,
            point_differential: pointsScored - pointsAgainst
          };
        });
        
        // Ordenar por porcentaje de victorias (de mayor a menor)
        const sortedStats = teamStats.sort((a, b) => {
          // Primero por porcentaje de victorias
          if (b.win_percentage !== a.win_percentage) {
            return b.win_percentage - a.win_percentage;
          }
          // En caso de empate, por diferencial de puntos
          return b.point_differential - a.point_differential;
        });
        
        setStandings(sortedStats);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) return <div className="text-center py-10">Cargando clasificación...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  // Obtener los tres primeros equipos para el podio
  const podiumTeams = standings.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Clasificación</h1>
      
      {/* Podio */}
      {standings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Podio Actual</h2>
          
          <div className="flex flex-col md:flex-row justify-center items-end space-y-4 md:space-y-0 md:space-x-8">
            {podiumTeams.map((team, index) => {
              // Determinar altura del podio según posición
              const podiumHeight = index === 1 ? 'h-40' : index === 2 ? 'h-32' : 'h-48';
              const position = index + 1;
              
              return (
                <div key={team.id} className="flex flex-col items-center">
                  <Link to={`/equipo/${team.id}`} className="mb-4">
                    <div className="w-24 h-24 rounded-full bg-white shadow-md overflow-hidden flex items-center justify-center p-2">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.team_name} 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-800">{team.team_name.substring(0, 2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p className="font-bold">{team.team_name}</p>
                      <p className="text-sm text-gray-600">{team.wins}W - {team.losses}L</p>
                    </div>
                  </Link>
                  
                  <div className={`${podiumHeight} w-28 bg-gradient-to-t ${position === 1 ? 'from-yellow-400 to-yellow-300' : position === 2 ? 'from-gray-400 to-gray-300' : 'from-amber-700 to-amber-600'} rounded-t-lg flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white">{position}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Tabla de clasificación */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PJ</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PC</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DIF</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                  No hay datos de clasificación disponibles
                </td>
              </tr>
            ) : (
              standings.map((team, index) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/equipo/${team.id}`} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={team.team_name} 
                            className="h-10 w-10 rounded-full object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">{team.team_name.substring(0, 2)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.games_played}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.wins}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.losses}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(team.win_percentage * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.points_scored}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.points_against}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={team.point_differential > 0 ? 'text-green-600' : team.point_differential < 0 ? 'text-red-600' : ''}>
                      {team.point_differential > 0 ? '+' : ''}{team.point_differential}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>PJ: Partidos Jugados | G: Ganados | P: Perdidos | %: Porcentaje de Victoria</p>
        <p>PF: Puntos a Favor | PC: Puntos en Contra | DIF: Diferencial de Puntos</p>
      </div>
    </div>
  );
};

export default Standings;