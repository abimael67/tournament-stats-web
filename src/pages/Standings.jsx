import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { getTeamDivision } from "../utils";

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
          .from("teams")
          .select("id, team_name, logo_url");

        if (teamsError) throw teamsError;

        // Obtener partidos completados
        const { data: games, error: gamesError } = await supabase
          .from("games")
          .select(
            "team_a_id, team_b_id, winner_team_id, score_team_a, score_team_b"
          )
          .eq("status", "completed");

        if (gamesError) throw gamesError;

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

  // Obtener los tres primeros equipos para el podio (general)

  return (
    <div className="container mx-auto px-4 py-8">
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
                        {index === 0 ? '-' : ((divisionA[0].wins - team.wins) + (team.losses - divisionA[0].losses)) / 2}
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
                        {index === 0 ? '-' : ((divisionB[0].wins - team.wins) + (team.losses - divisionB[0].losses)) / 2}
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
          PF: Puntos a Favor | PC: Puntos en Contra | DIF: Diferencial de Puntos | JD: Juegos Detrás
        </p>
      </div>
    </div>
  );
};

export default Standings;
