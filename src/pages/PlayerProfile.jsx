import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { getPositionName } from "../utils";

const PlayerProfile = () => {
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
      // Primero obtener los IDs de juegos completados o en progreso
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
          totalSteals: 0,
          totalFouls: 0,
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
          fouls,
          steals,
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
        const aggregated = statsData.reduce(
          (acc, stat) => {
            acc.totalGames += 1;
            acc.totalPoints += stat.points || 0;
            acc.totalRebounds += stat.rebounds || 0;
            acc.totalAssists += stat.assists || 0;
            acc.totalSteals += stat.steals || 0;
            acc.totalTechnicalFouls += stat.technical_fouls || 0;
            acc.totalFouls += stat.fouls || 0;
            acc.totalFieldGoalMade += stat.field_goal_made || 0;
            acc.totalFieldGoalAttempts += stat.field_goal_attempts || 0;
            acc.totalThreePointMade += stat.three_point_made || 0;
            acc.totalThreePointAttempts += stat.three_point_attempts || 0;
            acc.totalFreeThrowMade += stat.free_throw_made || 0;
            acc.totalFreeThrowAttempts += stat.free_throw_attempts || 0;
            return acc;
          },
          {
            totalGames: 0,
            totalPoints: 0,
            totalRebounds: 0,
            totalAssists: 0,
            totalSteals: 0,
            totalTechnicalFouls: 0,
            totalFieldGoalMade: 0,
            totalFieldGoalAttempts: 0,
            totalThreePointMade: 0,
            totalThreePointAttempts: 0,
            totalFreeThrowMade: 0,
            totalFreeThrowAttempts: 0,
            totalFouls: 0,
          }
        );

        // Calcular promedios y porcentajes
        aggregated.avgPoints =
          aggregated.totalGames > 0
            ? (aggregated.totalPoints / aggregated.totalGames).toFixed(1)
            : 0;
        aggregated.avgRebounds =
          aggregated.totalGames > 0
            ? (aggregated.totalRebounds / aggregated.totalGames).toFixed(1)
            : 0;
        aggregated.avgAssists =
          aggregated.totalGames > 0
            ? (aggregated.totalAssists / aggregated.totalGames).toFixed(1)
            : 0;
        aggregated.fieldGoalPercentage =
          aggregated.totalFieldGoalAttempts > 0
            ? (
                (aggregated.totalFieldGoalMade /
                  aggregated.totalFieldGoalAttempts) *
                100
              ).toFixed(1)
            : 0;
        aggregated.threePointPercentage =
          aggregated.totalThreePointAttempts > 0
            ? (
                (aggregated.totalThreePointMade /
                  aggregated.totalThreePointAttempts) *
                100
              ).toFixed(1)
            : 0;
        aggregated.freeThrowPercentage =
          aggregated.totalFreeThrowAttempts > 0
            ? (
                (aggregated.totalFreeThrowMade /
                  aggregated.totalFreeThrowAttempts) *
                100
              ).toFixed(1)
            : 0;

        setAggregatedStats(aggregated);
      }
    } catch (error) {
      console.error("Error fetching player statistics:", error);
    }
  };

  const getOpponentTeam = (game, playerTeamId) => {
    if (game?.team_a.id === playerTeamId) {
      return game.team_b;
    }
    return game?.team_a || {};
  };

  const getGameResult = (game, playerTeamId) => {
    if (game?.winner_team_id === playerTeamId) {
      return "Victoria";
    } else if (game?.winner_team_id === null) {
      return "En curso";
    } else {
      return "Derrota";
    }
  };

  const getGameScore = (game, playerTeamId) => {
    if (game?.team_a.id === playerTeamId) {
      return `${game?.score_team_a || 0} - ${game?.score_team_b || 0}`;
    }
    return `${game?.score_team_b || 0} - ${game?.score_team_a || 0}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || "Jugador no encontrado"}</p>
          <Link
            to="/jugadores"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Volver a la lista de jugadores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navegación */}
      <div className="mb-6">
        <Link
          to="/jugadores"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a jugadores
        </Link>
      </div>

      {/* Header del jugador */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            {player.profile_pic_url ? (
              <img
                src={player.profile_pic_url}
                alt={player.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                <span
                  className="text-4xl font-bold text-blue-800"
                  translate="no"
                >
                  {player.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <h1 className="text-4xl font-bold text-blue-800" translate="no">
                  {player.name}
                </h1>
                {player.inactive && (
                  <span
                    translate="no"
                    title="Este jugador se encuentra deshabilitado del torneo"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200"
                  >
                    Inactivo
                  </span>
                )}
              </div>
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl mt-2 md:mt-0">
                #{player.jersey_number}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-1">Equipo</h3>
                <Link
                  to={`/equipo/${player.team.id}`}
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  translate="no"
                >
                  {player.team.team_name}
                </Link>
                <p className="text-sm text-gray-500">
                  {player.team.church_name}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-1">Posición</h3>
                <p className="text-gray-700">
                  {getPositionName(player.position)}
                </p>
                <h3 className="font-semibold text-green-800 mb-1">Edad</h3>
                <p className="text-gray-700">
                  {player.age ? player.age + " años" : "No disponible"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas agregadas */}
      {aggregatedStats && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">
            Estadísticas de la Temporada
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {aggregatedStats.totalGames}
              </div>
              <div className="text-sm text-gray-600">Partidos</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">
                {aggregatedStats.avgPoints}
              </div>
              <div className="text-sm text-gray-600">Pts/Partido</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-800">
                {aggregatedStats.avgRebounds}
              </div>
              <div className="text-sm text-gray-600">Reb/Partido</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-800">
                {aggregatedStats.avgAssists}
              </div>
              <div className="text-sm text-gray-600">Ast/Partido</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-800">
                {aggregatedStats.fieldGoalPercentage}%
              </div>
              <div className="text-sm text-gray-600">% Tiros Campo</div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-800">
                {aggregatedStats.threePointPercentage}%
              </div>
              <div className="text-sm text-gray-600">% Triples</div>
            </div>
          </div>

          {/* Estadísticas totales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {aggregatedStats.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Puntos Totales</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {aggregatedStats.totalRebounds}
              </div>
              <div className="text-sm text-gray-600">Rebotes Totales</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {aggregatedStats.totalAssists}
              </div>
              <div className="text-sm text-gray-600">Asistencias Totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {aggregatedStats.totalSteals}
              </div>
              <div className="text-sm text-gray-600">Robos Totales</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {aggregatedStats.freeThrowPercentage}%
              </div>
              <div className="text-sm text-gray-600">% Tiros Libres</div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de partidos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">
          Historial de Partidos
        </h2>

        {playerStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No hay estadísticas registradas para este jugador
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reb
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ast
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    3P
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {playerStats.map((stat, index) => {
                  const opponent = getOpponentTeam(stat.game, player.team.id);
                  const result = getGameResult(stat.game, player.team.id);
                  const score = getGameScore(stat.game, player.team.id);

                  return (
                    <tr
                      key={stat.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a href={`/partido/${stat.game.id}`}>
                          {new Date(stat.game.date).toLocaleDateString("es-ES")}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opponent.team_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result === "Victoria"
                              ? "bg-green-100 text-green-800"
                              : result === "Derrota"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {result}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {score}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {stat.points || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.rebounds || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.assists || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.field_goal_made || 0}/
                        {stat.field_goal_attempts || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.three_point_made || 0}/
                        {stat.three_point_attempts || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.free_throw_made || 0}/
                        {stat.free_throw_attempts || 0}
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
  );
};

export default PlayerProfile;
