import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { getTeamDivision } from "../utils";

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [semiFinalsGames, setSemiFinalsGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);

        // Obtener equipos
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("id, team_name, logo_url");

        if (teamsError) throw teamsError;

        // Obtener partidos completados (solo regulares para clasificación)
        const { data: games, error: gamesError } = await supabase
          .from("games")
          .select(
            "team_a_id, team_b_id, winner_team_id, score_team_a, score_team_b"
          )
          .eq("status", "completed")
          .eq("type", "regular");

        if (gamesError) throw gamesError;

        // Obtener partidos de semifinales
        const { data: semiGames, error: semiGamesError } = await supabase
          .from("games")
          .select(
            "id, team_a_id, team_b_id, winner_team_id, score_team_a, place, score_team_b, status, date, team_a:team_a_id(team_name, logo_url), team_b:team_b_id(team_name, logo_url)"
          )
          .eq("type", "semi-final")
          .order("date", { ascending: true });

        if (semiGamesError) throw semiGamesError;

        setSemiFinalsGames(semiGames || []);

        // Calcular estadísticas para cada equipo
        const teamStats = teams.map((team) => {
          const teamGames = games.filter(
            (game) => game.team_a_id === team.id || game.team_b_id === team.id
          );

          const wins = teamGames.filter(
            (game) => game.winner_team_id === team.id
          ).length;
          const losses = teamGames.length - wins;

          // Calcular puntos a favor y en contra
          let pointsScored = 0;
          let pointsAgainst = 0;

          teamGames.forEach((game) => {
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
            win_percentage: teamGames.length > 0 ? wins / teamGames.length : 0,
            points_scored: pointsScored,
            points_against: pointsAgainst,
            point_differential: pointsScored - pointsAgainst,
          };
        });

        // Agregar división a cada equipo y ordenar
        const teamsWithDivision = teamStats.map((team) => ({
          ...team,
          division: getTeamDivision(team.team_name),
        }));

        // Ordenar por porcentaje de victorias (de mayor a menor)
        const sortedStats = teamsWithDivision.sort((a, b) => {
          // Primero por porcentaje de victorias
          if (b.win_percentage !== a.win_percentage) {
            return b.win_percentage - a.win_percentage;
          }
          // En caso de empate, por diferencial de puntos
          return b.point_differential - a.point_differential;
        });

        setStandings(sortedStats);
      } catch (err) {
        console.error("Error fetching standings:", err);
        setError("No se pudieron cargar las estadísticas");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading)
    return <div className="text-center py-10">Cargando clasificación...</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  // Agrupar equipos por división
  const divisionA = standings.filter((team) => team.division === "División A");
  const divisionB = standings.filter((team) => team.division === "División B");

  const getSemiFinalsWinsByTeam = (teamId) => {
    return semiFinalsGames.filter((game) => {
      return game.winner_team_id === teamId;
    }).length;
  };
  // Obtener los tres primeros equipos para el podio (general)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">
        Camino a la Final
      </h1>
      {/* Bracket Tournament Style */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative">
          {/* Tournament Bracket Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            {/* Semifinal 1 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-center mb-4 text-blue-800">
                Semifinal 1
              </h3>
              <div className="space-y-3">
                {divisionA.length > 0 && divisionB.length > 1 && (
                  <>
                    {/* Teams Matchup */}
                    <div className="bg-white rounded-lg p-3 border-2 border-blue-300 shadow-sm">
                      <div className="text-center">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center justify-center">
                            <img
                              src={
                                divisionA[0]?.logo_url ||
                                "/default-team-logo.png"
                              }
                              alt={divisionA[0]?.team_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
                              onError={(e) => {
                                e.target.src = "/default-team-logo.png";
                              }}
                            />
                            <span className="text-md font-bold text-gray-600 ml-2">
                              {getSemiFinalsWinsByTeam(divisionA[0]?.id)}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded font-semibold">
                            VS
                          </span>
                          <div className="flex items-center justify-center">
                            <span className="text-md font-bold text-gray-600 mr-2">
                              {getSemiFinalsWinsByTeam(divisionB[1]?.id)}
                            </span>
                            <img
                              src={
                                divisionB[1]?.logo_url ||
                                "/default-team-logo.png"
                              }
                              alt={divisionB[1]?.team_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
                              onError={(e) => {
                                e.target.src = "/default-team-logo.png";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Games */}
                    <div className="space-y-2">
                      {semiFinalsGames
                        .filter(
                          (game) =>
                            (game.team_a_id === divisionA[0]?.id &&
                              game.team_b_id === divisionB[1]?.id) ||
                            (game.team_a_id === divisionB[1]?.id &&
                              game.team_b_id === divisionA[0]?.id)
                        )
                        .map((game, index) => (
                          <div
                            key={game.id}
                            className="bg-white rounded p-2 border border-gray-200"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <a
                                href={`/partido/${game.id}`}
                                className="font-medium"
                              >
                                Juego {index + 1}
                                {index === 2 && "*"}
                              </a>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  game.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : game.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {game.status === "completed"
                                  ? "✓"
                                  : game.status === "in_progress"
                                  ? "⏳"
                                  : `${game.place} @ ${new Date(
                                      game.date
                                    ).toLocaleTimeString("es-ES", {
                                      hour12: true,
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`}
                              </span>
                              {game.status === "completed" && (
                                <span className="font-bold text-blue-600">
                                  {game.score_team_a} - {game.score_team_b}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      {semiFinalsGames.filter(
                        (game) =>
                          (game.team_a_id === divisionA[0]?.id &&
                            game.team_b_id === divisionB[1]?.id) ||
                          (game.team_a_id === divisionB[1]?.id &&
                            game.team_b_id === divisionA[0]?.id)
                      ).length === 0 && (
                        <div className="text-center text-gray-500 py-2 text-sm">
                          Por programar
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Final */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-300">
              <h3 className="text-lg font-bold text-center mb-4 text-yellow-800">
                🏆 FINAL
              </h3>
              <div className="bg-white rounded-lg p-4 border-2 border-yellow-400 shadow-md">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    Ganadores de Semifinales
                  </div>
                  <div className="flex justify-center items-center space-x-6 mb-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                      <span className="text-xs font-bold text-gray-600">
                        SF1
                      </span>
                    </div>
                    <span className="text-lg font-bold text-yellow-700">
                      VS
                    </span>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                      <span className="text-xs font-bold text-gray-600">
                        SF2
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Mejor de 3 partidos
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 rounded border">
                    <div className="text-xs text-yellow-700 font-medium">
                      🏆 Campeón del Torneo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Semifinal 2 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-center mb-4 text-blue-800">
                Semifinal 2
              </h3>
              <div className="space-y-3">
                {divisionB.length > 0 && divisionA.length > 1 && (
                  <>
                    {/* Teams Matchup */}
                    <div className="bg-white rounded-lg p-3 border-2 border-blue-300 shadow-sm">
                      <div className="text-center">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center justify-center">
                            <img
                              src={
                                divisionB[0]?.logo_url ||
                                "/default-team-logo.png"
                              }
                              alt={divisionB[0]?.team_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
                              onError={(e) => {
                                e.target.src = "/default-team-logo.png";
                              }}
                            />
                            <span className="text-md font-bold text-gray-600 ml-2">
                              {getSemiFinalsWinsByTeam(divisionB[0]?.id)}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded font-semibold">
                            VS
                          </span>
                          <div className="flex items-center justify-center">
                            <span className="text-md font-bold text-gray-600 mr-2">
                              {getSemiFinalsWinsByTeam(divisionA[1]?.id)}
                            </span>
                            <img
                              src={
                                divisionA[1]?.logo_url ||
                                "/default-team-logo.png"
                              }
                              alt={divisionA[1]?.team_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
                              onError={(e) => {
                                e.target.src = "/default-team-logo.png";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Games */}
                    <div className="space-y-2">
                      {semiFinalsGames
                        .filter(
                          (game) =>
                            (game.team_a_id === divisionB[0]?.id &&
                              game.team_b_id === divisionA[1]?.id) ||
                            (game.team_a_id === divisionA[1]?.id &&
                              game.team_b_id === divisionB[0]?.id)
                        )
                        .map((game, index) => (
                          <div
                            key={game.id}
                            className="bg-white rounded p-2 border border-gray-200"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <a
                                href={`/partido/${game.id}`}
                                className="font-medium"
                              >
                                Juego {index + 1}
                                {index === 2 && "*"}
                              </a>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  game.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : game.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {game.status === "completed"
                                  ? "✓"
                                  : game.status === "in_progress"
                                  ? "⏳"
                                  : `${game.place} @ ${new Date(
                                      game.date
                                    ).toLocaleString("es-ES", {
                                      hour12: true,
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`}
                              </span>
                              {game.status === "completed" && (
                                <span className="font-bold text-blue-600">
                                  {game.score_team_a} - {game.score_team_b}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      {semiFinalsGames.filter(
                        (game) =>
                          (game.team_a_id === divisionB[0]?.id &&
                            game.team_b_id === divisionA[1]?.id) ||
                          (game.team_a_id === divisionA[1]?.id &&
                            game.team_b_id === divisionB[0]?.id)
                      ).length === 0 && (
                        <div className="text-center text-gray-500 py-2 text-sm">
                          Por programar
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Connection Lines */}
          <div className="lg:hidden mt-4">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">↓</div>
                <div className="text-xs text-gray-500">
                  Ganadores avanzan a la Final
                </div>
                <div className="text-sm text-gray-600 mt-2">↓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border">
          <div className="text-center">
            <h4 className="font-bold text-gray-700 mb-2">
              🏀 Formato del Torneo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded p-3 border">
                <div className="font-semibold text-blue-600">Semifinales</div>
                <div className="text-gray-600">Mejor de 3 partidos</div>
                <div className="text-xs text-gray-500">
                  Top 2 de cada división
                </div>
                <div className="text-xs text-gray-500">
                  * Si fuese necesario
                </div>
              </div>
              <div className="bg-white rounded p-3 border">
                <div className="font-semibold text-yellow-600">Final</div>
                <div className="text-gray-600">Mejor de 3 partidos</div>
                <div className="text-xs text-gray-500">
                  Ganadores de semifinales
                </div>
              </div>
              <div className="bg-white rounded p-3 border">
                <div className="font-semibold text-green-600">Campeón</div>
                <div className="text-gray-600">Ganador de la final</div>
                <div className="text-xs text-gray-500">
                  🏆 Trofeo del torneo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Clasificación</h1>

      {/* Tablas de clasificación por división */}
      <div className="space-y-8">
        {/* División A */}
        {divisionA.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">División A</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pos
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Equipo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PJ
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      G
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      P
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      %
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PF
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PC
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      DIF
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      JD
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {divisionA.map((team, index) => (
                    <>
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/equipo/${team.id}`}
                            className="flex items-center"
                          >
                            <div className="flex-shrink-0 h-10 w-10">
                              {team.logo_url ? (
                                <img
                                  src={team.logo_url}
                                  alt={team.team_name}
                                  className="h-10 w-10 rounded-full object-contain"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span
                                    className="text-xs font-medium text-blue-800"
                                    translate="no"
                                  >
                                    {team.team_name.substring(0, 2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div
                                className="text-sm font-medium text-gray-900"
                                translate="no"
                              >
                                {team.team_name}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.games_played}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(team.win_percentage * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.points_scored}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.points_against}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={
                              team.point_differential > 0
                                ? "text-green-600"
                                : team.point_differential < 0
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {team.point_differential > 0 ? "+" : ""}
                            {team.point_differential}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index === 0
                            ? "-"
                            : (divisionA[0].wins -
                                team.wins +
                                (team.losses - divisionA[0].losses)) /
                              2}
                        </td>
                      </tr>
                      {index === 1 && (
                        <tr>
                          <td colSpan="10" className="px-6 py-2">
                            <div className="flex items-center justify-center">
                              <div className="flex-grow border-t border-green-300"></div>
                              <span className="px-4 text-xs font-medium text-green-600 bg-green-50 rounded-full">
                                Línea de Playoffs
                              </span>
                              <div className="flex-grow border-t border-green-300"></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* División B */}
        {divisionB.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">División B</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pos
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Equipo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PJ
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      G
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      P
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      %
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PF
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      PC
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      DIF
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      JD
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {divisionB.map((team, index) => (
                    <>
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/equipo/${team.id}`}
                            className="flex items-center"
                          >
                            <div className="flex-shrink-0 h-10 w-10">
                              {team.logo_url ? (
                                <img
                                  src={team.logo_url}
                                  alt={team.team_name}
                                  className="h-10 w-10 rounded-full object-contain"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <span
                                    className="text-xs font-medium text-green-800"
                                    translate="no"
                                  >
                                    {team.team_name.substring(0, 2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div
                                className="text-sm font-medium text-gray-900"
                                translate="no"
                              >
                                {team.team_name}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.games_played}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(team.win_percentage * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.points_scored}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {team.points_against}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={
                              team.point_differential > 0
                                ? "text-green-600"
                                : team.point_differential < 0
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {team.point_differential > 0 ? "+" : ""}
                            {team.point_differential}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index === 0
                            ? "-"
                            : (divisionB[0].wins -
                                team.wins +
                                (team.losses - divisionB[0].losses)) /
                              2}
                        </td>
                      </tr>
                      {index === 1 && (
                        <tr>
                          <td colSpan="10" className="px-6 py-2">
                            <div className="flex items-center justify-center">
                              <div className="flex-grow border-t border-green-300"></div>
                              <span className="px-4 text-xs font-medium text-green-600 bg-green-50 rounded-full">
                                Línea de Playoffs
                              </span>
                              <div className="flex-grow border-t border-green-300"></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensaje si no hay datos */}
        {standings.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">
              No hay datos de clasificación disponibles
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>
          PJ: Partidos Jugados | G: Ganados | P: Perdidos | %: Porcentaje de
          Victoria
        </p>
        <p>
          PF: Puntos a Favor | PC: Puntos en Contra | DIF: Diferencial de Puntos
          | JD: Juegos Detrás
        </p>
      </div>
    </div>
  );
};

export default Standings;
