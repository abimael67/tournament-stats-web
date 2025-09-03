import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { getPositionName } from "../utils";

const PerfilJugadorBeta = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [aggregatedStats, setAggregatedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del jugador con información del equipo
      const { data: playerData, error: playerError } = await supabase
        .from("members")
        .select(
          `
          id,
          name,
          age,
          jersey_number,
          role,
          profile_pic_url,
          position,
          inactive,
          team:team_id(
            id,
            team_name,
            church_name,
            logo_url
          )
        `
        )
        .eq("id", id)
        .eq("role", "player")
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      // Obtener estadísticas del jugador
      await fetchPlayerStatistics();
    } catch (error) {
      console.error("Error fetching player data:", error);
      setError("Error al cargar los datos del jugador");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStatistics = async () => {
    try {
      // Primero obtener los IDs de juegos completados
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("id")
        .in("status", ["completed", "in_progress"]);

      if (gamesError) throw gamesError;

      const gameIds = gamesData?.map((game) => game.id) || [];

      if (gameIds.length === 0) {
        setPlayerStats([]);
        setAggregatedStats({
          totalGames: 0,
          totalPoints: 0,
          totalRebounds: 0,
          totalAssists: 0,
          totalTechnicalFouls: 0,
          fieldGoalPercentage: 0,
          threePointPercentage: 0,
          freeThrowPercentage: 0,
          averagePoints: 0,
          averageRebounds: 0,
          averageAssists: 0,
        });
        return;
      }

      // Obtener estadísticas del jugador con información de partidos
      const { data: statsData, error: statsError } = await supabase
        .from("stats")
        .select(
          `
          id,
          points,
          rebounds,
          assists,
          technical_fouls,
          field_goal_made,
          field_goal_attempts,
          three_point_made,
          three_point_attempts,
          free_throw_made,
          free_throw_attempts,
          game:game_id(
            id,
            date,
            status,
            team_a:team_a_id(id, team_name),
            team_b:team_b_id(id, team_name),
            score_team_a,
            score_team_b,
            winner_team_id
          )
        `
        )
        .eq("member_id", id)
        .in("game_id", gameIds)
        .order("game(date)", { ascending: false });

      if (statsError) throw statsError;

      setPlayerStats(statsData || []);

      // Calcular estadísticas agregadas
      if (statsData && statsData.length > 0) {
        const totals = statsData.reduce(
          (acc, stat) => {
            acc.totalPoints += stat.points || 0;
            acc.totalRebounds += stat.rebounds || 0;
            acc.totalAssists += stat.assists || 0;
            acc.totalTechnicalFouls += stat.technical_fouls || 0;
            acc.totalFieldGoalMade += stat.field_goal_made || 0;
            acc.totalFieldGoalAttempts += stat.field_goal_attempts || 0;
            acc.totalThreePointMade += stat.three_point_made || 0;
            acc.totalThreePointAttempts += stat.three_point_attempts || 0;
            acc.totalFreeThrowMade += stat.free_throw_made || 0;
            acc.totalFreeThrowAttempts += stat.free_throw_attempts || 0;
            return acc;
          },
          {
            totalPoints: 0,
            totalRebounds: 0,
            totalAssists: 0,
            totalTechnicalFouls: 0,
            totalFieldGoalMade: 0,
            totalFieldGoalAttempts: 0,
            totalThreePointMade: 0,
            totalThreePointAttempts: 0,
            totalFreeThrowMade: 0,
            totalFreeThrowAttempts: 0,
          }
        );

        const totalGames = statsData.length;
        const fieldGoalPercentage = totals.totalFieldGoalAttempts > 0 
          ? ((totals.totalFieldGoalMade / totals.totalFieldGoalAttempts) * 100).toFixed(1)
          : 0;
        const threePointPercentage = totals.totalThreePointAttempts > 0
          ? ((totals.totalThreePointMade / totals.totalThreePointAttempts) * 100).toFixed(1)
          : 0;
        const freeThrowPercentage = totals.totalFreeThrowAttempts > 0
          ? ((totals.totalFreeThrowMade / totals.totalFreeThrowAttempts) * 100).toFixed(1)
          : 0;

        setAggregatedStats({
          totalGames,
          ...totals,
          fieldGoalPercentage,
          threePointPercentage,
          freeThrowPercentage,
          averagePoints: (totals.totalPoints / totalGames).toFixed(1),
          averageRebounds: (totals.totalRebounds / totalGames).toFixed(1),
          averageAssists: (totals.totalAssists / totalGames).toFixed(1),
        });
      }
    } catch (error) {
      console.error("Error fetching player statistics:", error);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const PlayerAvatar = ({ size = "w-32 h-32", textSize = "text-4xl" }) => {
    if (player?.profile_pic_url) {
      return (
        <img
          src={player.profile_pic_url}
          alt={player.name}
          className={`${size} rounded-full object-cover border-4 border-white shadow-xl`}
        />
      );
    }
    
    return (
      <div className={`${size} bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center border-4 border-white shadow-xl`}>
        <span className={`${textSize} font-bold text-white`}>
          {getInitials(player?.name || "")}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando perfil del jugador...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || "Jugador no encontrado"}</p>
          <Link
            to="/jugadores"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Volver a Jugadores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Player Avatar */}
            <div className="flex-shrink-0">
              <PlayerAvatar />
            </div>
            
            {/* Player Info */}
            <div className="text-center lg:text-left flex-1">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <h1 className="text-4xl lg:text-5xl font-bold">{player.name}</h1>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-semibold">
                  #{player.jersey_number}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4">
                <Link
                  to={`/equipo/${player.team?.id}`}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {player.team?.logo_url && (
                    <img src={player.team.logo_url} alt={player.team.team_name} className="w-6 h-6" />
                  )}
                  <span className="font-semibold">{player.team?.team_name}</span>
                </Link>
                
                {player.position && (
                  <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg font-medium">
                    {getPositionName(player.position)}
                  </span>
                )}
                
                {player.age && (
                  <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg font-medium">
                    {player.age} años
                  </span>
                )}
              </div>
              
              <p className="text-blue-100 text-lg">
                {player.team?.church_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {aggregatedStats && aggregatedStats.totalGames > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Estadísticas de Temporada</h2>
            
            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {aggregatedStats.averagePoints}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Puntos por Juego</div>
                <div className="text-xs text-gray-500 mt-1">{aggregatedStats.totalPoints} total</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {aggregatedStats.averageRebounds}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Rebotes por Juego</div>
                <div className="text-xs text-gray-500 mt-1">{aggregatedStats.totalRebounds} total</div>
              </div>
              
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {aggregatedStats.averageAssists}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Asistencias por Juego</div>
                <div className="text-xs text-gray-500 mt-1">{aggregatedStats.totalAssists} total</div>
              </div>
            </div>
            
            {/* Shooting Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">
                  {aggregatedStats.fieldGoalPercentage}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">TC%</div>
                <div className="text-xs text-gray-500">
                  {aggregatedStats.totalFieldGoalMade}/{aggregatedStats.totalFieldGoalAttempts}
                </div>
              </div>
              
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">
                  {aggregatedStats.threePointPercentage}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">3P%</div>
                <div className="text-xs text-gray-500">
                  {aggregatedStats.totalThreePointMade}/{aggregatedStats.totalThreePointAttempts}
                </div>
              </div>
              
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">
                  {aggregatedStats.freeThrowPercentage}%
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">TL%</div>
                <div className="text-xs text-gray-500">
                  {aggregatedStats.totalFreeThrowMade}/{aggregatedStats.totalFreeThrowAttempts}
                </div>
              </div>
              
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-800">
                  {aggregatedStats.totalGames}
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Juegos</div>
                <div className="text-xs text-gray-500">Jugados</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Log */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Historial de Partidos</h2>
            <p className="text-gray-600 mt-1">Estadísticas por juego de la temporada actual</p>
          </div>
          
          {playerStats.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin estadísticas</h3>
              <p className="text-gray-600">No hay estadísticas registradas para este jugador</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Oponente</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">PTS</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">REB</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">AST</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">TC</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">3P</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">TL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {playerStats.map((stat, index) => {
                    const game = stat.game;
                    const isPlayerTeamA = game.team_a.id === player.team?.id;
                    const opponent = isPlayerTeamA ? game.team_b : game.team_a;
                    const playerScore = isPlayerTeamA ? game.score_team_a : game.score_team_b;
                    const opponentScore = isPlayerTeamA ? game.score_team_b : game.score_team_a;
                    const isWin = game.winner_team_id === player.team?.id;
                    
                    return (
                      <tr key={stat.id} className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(game.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">{isPlayerTeamA ? 'vs' : '@'}</span>
                            <span className="text-sm font-medium text-gray-900">{opponent.team_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isWin 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isWin ? 'W' : 'L'} {playerScore}-{opponentScore}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">{stat.points || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">{stat.rebounds || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">{stat.assists || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600">
                            {stat.field_goal_made || 0}/{stat.field_goal_attempts || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600">
                            {stat.three_point_made || 0}/{stat.three_point_attempts || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600">
                            {stat.free_throw_made || 0}/{stat.free_throw_attempts || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilJugadorBeta;