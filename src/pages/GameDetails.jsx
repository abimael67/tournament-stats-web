import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [teamAStats, setTeamAStats] = useState([]);
  const [teamBStats, setTeamBStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        
        // Obtener información del partido
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select(`
            id,
            date,
            status,
            place,
            score_team_a,
            score_team_b,
            winner_team_id,
            team_a:team_a_id(id, team_name, church_name, logo_url),
            team_b:team_b_id(id, team_name, church_name, logo_url)
          `)
          .eq('id', id)
          .single();

        if (gameError) throw gameError;
        if (!gameData) throw new Error('Partido no encontrado');

        setGame(gameData);

        // Obtener estadísticas de los jugadores
        const { data: statsData, error: statsError } = await supabase
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
            member:member_id(
              id,
              name,
              jersey_number,
              team_id
            )
          `)
          .eq('game_id', id)
          .order('points', { ascending: false })
          .order('rebounds', { ascending: false })
          .order('assists', { ascending: false });  

        if (statsError) throw statsError;

        // Separar estadísticas por equipo
        const teamAPlayerStats = statsData.filter(
          stat => stat.member.team_id === gameData.team_a.id
        );
        const teamBPlayerStats = statsData.filter(
          stat => stat.member.team_id === gameData.team_b.id
        );

        setTeamAStats(teamAPlayerStats);
        setTeamBStats(teamBPlayerStats);

      } catch (err) {
        console.error('Error fetching game details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGameDetails();
    }
  }, [id]);

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'postponed': 'Pospuesto'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'postponed': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateFieldGoalPercentage = (made, attempts) => {
    if (attempts === 0) return '0.0';
    return ((made / attempts) * 100).toFixed(1);
  };

  const StatsTable = ({ stats, teamName, teamColor = 'blue' }) => {
    const teamStats = stats.reduce((acc, stat) => {
      acc.totalPoints += stat.points;
      acc.totalRebounds += stat.rebounds;
      acc.totalAssists += stat.assists;
      acc.totalFouls += stat.fouls;
      acc.totalTechs += stat.technical_fouls;
      acc.totalFGMade += stat.field_goal_made;
      acc.totalFGAttempts += stat.field_goal_attempts;
      acc.total3PMade += stat.three_point_made;
      acc.total3PAttempts += stat.three_point_attempts;
      acc.totalFTMade += stat.free_throw_made;
      acc.totalFTAttempts += stat.free_throw_attempts;
      return acc;
    }, {
      totalPoints: 0,
      totalRebounds: 0,
      totalAssists: 0,
      totalFouls: 0,
      totalTechs: 0,
      totalFGMade: 0,
      totalFGAttempts: 0,
      total3PMade: 0,
      total3PAttempts: 0,
      totalFTMade: 0,
      totalFTAttempts: 0
    });

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`bg-${teamColor}-600 text-white px-6 py-4`}>
          <h3 className="text-xl font-bold">{teamName}</h3>
          <div className="text-sm opacity-90">
            Total: {teamStats.totalPoints} pts | {teamStats.totalRebounds} reb | {teamStats.totalAssists} ast
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PTS
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  REB
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AST
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TC%
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  3P%
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TL%
                </th>
               <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROBOS
                </th> 
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FALTAS
                </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TÉCNICAS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No hay estadísticas registradas para este equipo
                  </td>
                </tr>
              ) : (
                stats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                           <a href={`/jugador/${stat.member.id}`}> {stat.member.name}</a>
                          </div>
                          <div className="text-sm text-gray-500">
                            #{stat.member.jersey_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                      {stat.points}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.rebounds}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.assists}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.field_goal_made}/{stat.field_goal_attempts}
                      <div className="text-xs text-gray-500">
                        {calculateFieldGoalPercentage(stat.field_goal_made, stat.field_goal_attempts)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.three_point_made}/{stat.three_point_attempts}
                      <div className="text-xs text-gray-500">
                        {calculateFieldGoalPercentage(stat.three_point_made, stat.three_point_attempts)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.free_throw_made}/{stat.free_throw_attempts}
                      <div className="text-xs text-gray-500">
                        {calculateFieldGoalPercentage(stat.free_throw_made, stat.free_throw_attempts)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.steals}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.fouls}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stat.technical_fouls}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del partido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/calendario" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Calendario
          </Link>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏀</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partido no encontrado</h2>
          <p className="text-gray-600 mb-4">El partido que buscas no existe o ha sido eliminado.</p>
          <Link 
            to="/calendario" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Calendario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header del partido */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              to="/calendario" 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Volver al Calendario
            </Link>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(game.status)}`}>
              {getStatusText(game.status)}
            </span>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Detalles del Partido
            </h1>
            <p className="text-gray-600 mb-6">
              {new Date(game.date).toLocaleTimeString('es-DO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              <br />
              {game.place}
            </p>
            
            
            {/* Marcador */}
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="flex items-center space-x-4">
                  {game.team_a.logo_url && (
                    <img 
                      src={game.team_a.logo_url} 
                      alt={`Logo ${game.team_a.team_name}`}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      <a href={`/equipo/${game.team_a.id}`}>{game.team_a.team_name}</a>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {game.team_a.church_name}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {game.score_team_a !== null ? game.score_team_a : '-'}
                </div>
                {game.winner_team_id === game.team_a.id && (
                  <div className="text-green-600 font-semibold text-sm mt-1">GANADOR</div>
                )}
              </div>
              
              <div className="text-2xl font-bold text-gray-400">VS</div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {game.score_team_b !== null ? game.score_team_b : '-'}
                </div>
                {game.winner_team_id === game.team_b.id && (
                  <div className="text-green-600 font-semibold text-sm mt-1">GANADOR</div>
                )}
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      <a href={`/equipo/${game.team_b.id}`}>{game.team_b.team_name}</a>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {game.team_b.church_name}
                    </p>
                  </div>
                  {game.team_b.logo_url && (
                    <img 
                      src={game.team_b.logo_url} 
                      alt={`Logo ${game.team_b.team_name}`}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estadísticas por equipo */}
        <div className="space-y-8">
          <StatsTable 
            stats={teamAStats} 
            teamName={game.team_a.team_name}
            teamColor="blue"
          />
          
          <StatsTable 
            stats={teamBStats} 
            teamName={game.team_b.team_name}
            teamColor="red"
          />
        </div>
      </div>
    </div>
  );
};

export default GameDetails;