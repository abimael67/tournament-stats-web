import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";

const Equipos = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);

        // Obtener equipos
        const { data, error } = await supabase
          .from("teams")
          .select("*")
          .order("team_name");

        if (error) throw error;

        setTeams(data || []);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("No se pudieron cargar los equipos");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading)
    return <div className="text-center py-10">Cargando equipos...</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">
        Equipos Participantes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay equipos registrados</p>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              to={`/equipo/${team.id}`}
              key={team.id}
              className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                {team.logo_url ? (
                  <div className="relative z-10 w-36 h-36 bg-white rounded-full shadow-lg flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    <img
                      src={team.logo_url}
                      alt={team.team_name}
                      className="w-full h-full object-contain scale-125"
                    />
                  </div>
                ) : (
                  <div className="relative z-10 w-36 h-36 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <span
                      className="text-3xl font-bold text-white"
                      translate="no"
                    >
                      {team.team_name.substring(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
              </div>

              <div className="p-6 bg-white">
                <h2
                  className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors"
                  translate="no"
                >
                  {team.team_name}
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  {team.church_name}
                </p>
                <div className="mt-4 flex items-center text-blue-500">
                  <span className="text-sm font-medium">Ver detalles</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
          ))
        )}
      </div>
    </div>
  );
};

export default Equipos;
