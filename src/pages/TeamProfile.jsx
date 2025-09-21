import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { getPositionName } from "../utils";

const TeamProfile = () => {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [teamGames, setTeamGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchTeamData();
      fetchTeamStatistics();
      fetchTeamGames();
    }
  }, [id]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del equipo
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Obtener miembros del equipo (jugadores, entrenador, asistente)
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("team_id", id)
        .order("role", { ascending: true })
        .order("jersey_number", { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData);

      // Obtener estadísticas del equipo
      await fetchTeamStatistics();

      // Obtener historial de partidos del equipo
      await fetchTeamGames();
    } catch (error) {
      console.error("Error fetching team data:", error);
      setError("Error al cargar los datos del equipo");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamGames = async () => {
    try {
      // Obtener todos los partidos del equipo (completados y programados)
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select(
          `
          *,
          team_a:teams!team_a_id(id, team_name, logo_url),
          team_b:teams!team_b_id(id, team_name, logo_url)
        `
        )
        .or(`team_a_id.eq.${id},team_b_id.eq.${id}`)
        .order("date", { ascending: true });

      if (gamesError) throw gamesError;
      setTeamGames(gamesData || []);
    } catch (error) {
      console.error("Error fetching team games:", error);
    }
  };

  const fetchTeamStatistics = async () => {
    try {
      // Obtener partidos jugados por el equipo
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .or(`team_a_id.eq.${id},team_b_id.eq.${id}`)
        .eq("status", "completed");

      if (gamesError) throw gamesError;

      // Calcular estadísticas del equipo
      let totalGames = gamesData.length;
      let wins = 0;
      let losses = 0;
      let totalPointsFor = 0;
      let totalPointsAgainst = 0;

      gamesData.forEach((game) => {
        const isTeamA = game.team_a_id === id;
        const teamScore = isTeamA ? game.score_team_a : game.score_team_b;
        const opponentScore = isTeamA ? game.score_team_b : game.score_team_a;

        totalPointsFor += teamScore || 0;
        totalPointsAgainst += opponentScore || 0;

        if (game.winner_team_id === id) {
          wins++;
        } else if (game.winner_team_id !== null) {
          losses++;
        }
      });

      // Obtener estadísticas individuales agregadas
      const gameIds = gamesData.map((game) => game.id);
      let statsData = [];

      if (gameIds.length > 0) {
        // Primero obtener los member_ids del equipo
        const { data: teamMembers, error: membersError } = await supabase
          .from("members")
          .select("id")
          .eq("team_id", id);

        if (membersError) {
          console.error("Error fetching team members:", membersError);
        } else if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map((member) => member.id);

          // Luego obtener las estadísticas solo de esos miembros
          const { data: fetchedStatsData, error: statsError } = await supabase
            .from("stats")
            .select(
              `
              points,
              rebounds,
              assists,
              technical_fouls,
              field_goal_made,
              field_goal_attempts,
              three_point_made,
              three_point_attempts,
              free_throw_made,
              free_throw_attempts
            `
            )
            .in("game_id", gameIds)
            .in("member_id", memberIds);

          if (statsError) {
            console.error("Error fetching stats:", statsError);
          } else {
            statsData = fetchedStatsData || [];
          }
        }
      }

      // Agregar estadísticas individuales
      const aggregatedStats = statsData.reduce(
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

      setTeamStats({
        gamesPlayed: totalGames,
        wins,
        losses,
        winPercentage:
          totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0,
        pointsFor: totalPointsFor,
        pointsAgainst: totalPointsAgainst,
        avgPointsFor:
          totalGames > 0 ? (totalPointsFor / totalGames).toFixed(1) : 0,
        avgPointsAgainst:
          totalGames > 0 ? (totalPointsAgainst / totalGames).toFixed(1) : 0,
        ...aggregatedStats,
      });
    } catch (error) {
      console.error("Error fetching team statistics:", error);
    }
  };

  const getCoach = () => members.find((member) => member.role === "coach");
  const getAssistant = () =>
    members.find((member) => member.role === "assistant");
  const getPlayers = () => members.filter((member) => member.role === "player");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || "Equipo no encontrado"}</p>
        </div>
      </div>
    );
  }

  const coach = getCoach();
  const assistant = getAssistant();
  const players = getPlayers();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header del equipo */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.team_name}
                className="w-32 h-32 object-contain rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                <span
                  className="text-4xl font-bold text-blue-800"
                  translate="no"
                >
                  {team.team_name.substring(0, 2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-grow text-center md:text-left">
            <h1
              className="text-4xl font-bold text-blue-800 mb-2"
              translate="no"
            >
              {team.team_name}
            </h1>
            <p className="text-xl text-gray-600 mb-4">{team.church_name}</p>

            {/* Información del cuerpo técnico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coach && (
                <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-blue-800 mb-1">
                      Entrenador
                    </h3>
                    <p className="text-gray-700">{coach.name}</p>
                    {coach.age && (
                      <p className="text-sm text-gray-500">{coach.age} años</p>
                    )}
                  </div>
                  {coach.profile_pic_url && (
                    <div className="flex-shrink-0 ml-4">
                      <img
                        src={coach.profile_pic_url}
                        alt={coach.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {assistant && (
                <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-green-800 mb-1">
                      Asistente
                    </h3>
                    <p className="text-gray-700">{assistant.name}</p>
                    {assistant.age && (
                      <p className="text-sm text-gray-500">
                        {assistant.age} años
                      </p>
                    )}
                  </div>
                  {assistant.profile_pic_url && (
                    <div className="flex-shrink-0 ml-4">
                      <img
                        src={assistant.profile_pic_url}
                        alt={assistant.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas del equipo */}
      {teamStats && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">
            Estadísticas del Equipo
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {teamStats.gamesPlayed}
              </div>
              <div className="text-sm text-gray-600">Partidos</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">
                {teamStats.wins}
              </div>
              <div className="text-sm text-gray-600">Victorias</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-800">
                {teamStats.losses}
              </div>
              <div className="text-sm text-gray-600">Derrotas</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-800">
                {teamStats.winPercentage}%
              </div>
              <div className="text-sm text-gray-600">% Victorias</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-800">
                {teamStats.avgPointsFor}
              </div>
              <div className="text-sm text-gray-600">Pts/Partido</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {teamStats.avgPointsAgainst}
              </div>
              <div className="text-sm text-gray-600">Pts Recibidos</div>
            </div>
          </div>

          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {teamStats.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Puntos Totales</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {teamStats.totalRebounds}
              </div>
              <div className="text-sm text-gray-600">Rebotes</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {teamStats.totalAssists}
              </div>
              <div className="text-sm text-gray-600">Asistencias</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {teamStats.totalFieldGoalAttempts > 0
                  ? (
                      (teamStats.totalFieldGoalMade /
                        teamStats.totalFieldGoalAttempts) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">% Tiros de Campo</div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de partidos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">
          Historial de Partidos
        </h2>

        {teamGames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No hay partidos registrados para este equipo
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="flex space-x-4 pb-4"
              style={{ width: "max-content" }}
            >
              {teamGames.map((game) => {
                const isTeamA = game.team_a_id === team?.id;
                const teamScore = isTeamA
                  ? game.score_team_a
                  : game.score_team_b;
                const opponentScore = isTeamA
                  ? game.score_team_b
                  : game.score_team_a;
                const opponent = isTeamA ? game.team_b : game.team_a;
                const isWinner = game.winner_team_id === team?.id;
                const isCompleted = game.status === "completed";
                const isInvalid = game.status === "invalid";
                console.log("Is invalid:", isInvalid);
                return (
                  <Link
                    to={`/partido/${game.id}`}
                    key={game.id}
                    className={`block rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex-shrink-0 w-64 ${
                      isCompleted
                        ? isWinner
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                        : isInvalid
                        ? "bg-gradient-to-r from-gray-500 to-gray-600"
                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                    }`}
                  >
                    <div className="p-4 text-white">
                      <div className="text-center mb-3">
                        <div className="text-xs opacity-90">
                          {new Date(game.date).toLocaleDateString("es-DO", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                        <div className="text-xs opacity-75">{game.place}</div>
                        {game.status === "in_progress" && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold mt-1 inline-block animate-pulse">
                            🔴 EN VIVO
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          {team?.logo_url ? (
                            <img
                              src={team.logo_url}
                              alt={team.team_name}
                              className="w-10 h-10 object-contain mx-auto mb-1"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-1">
                              <span
                                className="text-sm font-bold"
                                translate="no"
                              >
                                {team?.team_name?.substring(0, 2)}
                              </span>
                            </div>
                          )}
                          <div
                            className="font-semibold text-xs truncate"
                            translate="no"
                          >
                            {team?.team_name}
                          </div>
                        </div>

                        <div className="text-center px-2">
                          {isCompleted || isInvalid ? (
                            <div className="text-lg font-bold">
                              {teamScore} - {opponentScore}
                            </div>
                          ) : (
                            <div className="text-sm font-bold opacity-75">
                              VS
                            </div>
                          )}
                        </div>

                        <div className="text-center flex-1">
                          {opponent?.logo_url ? (
                            <img
                              src={opponent.logo_url}
                              alt={opponent.team_name}
                              className="w-10 h-10 object-contain mx-auto mb-1"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-1">
                              <span
                                className="text-sm font-bold"
                                translate="no"
                              >
                                {opponent?.team_name?.substring(0, 2)}
                              </span>
                            </div>
                          )}
                          <div
                            className="font-semibold text-xs truncate"
                            translate="no"
                          >
                            {opponent?.team_name}
                          </div>
                        </div>
                      </div>

                      {(isCompleted || isInvalid) && (
                        <div className="text-center mt-2">
                          <span className="text-xs font-bold">
                            {isInvalid
                              ? "🚫 ANULADO"
                              : isWinner
                              ? "✅ VICTORIA"
                              : "❌ DERROTA"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lista de jugadores */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">
          Plantilla de Jugadores
        </h2>

        {players.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No hay jugadores registrados en este equipo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                to={`/jugador/${player.id}`}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors block"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {player.profile_pic_url ? (
                      <img
                        src={player.profile_pic_url}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-800">
                          {player.jersey_number}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow">
                    <h3
                      className={`font-semibold text-gray-800 ${
                        player.inactive && "line-through"
                      }`}
                      translate="no"
                    >
                      {player.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>#{player.jersey_number}</span>
                      {player.position && (
                        <span>• {getPositionName(player.position)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-blue-600 hover:text-blue-800">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamProfile;
