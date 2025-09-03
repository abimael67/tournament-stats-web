import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";

const Lideres = () => {
  const navigate = useNavigate();
  const [lideres, setLideres] = useState({
    puntos: { lider: null, finalistas: [] },
    rebotes: { lider: null, finalistas: [] },
    asistencias: { lider: null, finalistas: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeadersData();
  }, []);

  const fetchLeadersData = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los jugadores con sus equipos
       const { data: playersData, error: playersError } = await supabase
         .from("members")
         .select(`
           id,
           name,
           profile_pic_url,
           team:team_id(team_name)
         `)
         .eq("role", "player");

      if (playersError) throw playersError;

      // Obtener todas las estadísticas de juegos completados
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("id")
        .eq("status", "completed");

      if (gamesError) throw gamesError;

      const gameIds = gamesData?.map(game => game.id) || [];

      if (gameIds.length === 0) {
        setLideres({
          puntos: { lider: null, finalistas: [] },
          rebotes: { lider: null, finalistas: [] },
          asistencias: { lider: null, finalistas: [] }
        });
        return;
      }

      // Obtener todas las estadísticas
      const { data: statsData, error: statsError } = await supabase
        .from("stats")
        .select(`
          member_id,
          points,
          rebounds,
          assists
        `)
        .in("game_id", gameIds);

      if (statsError) throw statsError;

      // Calcular estadísticas agregadas por jugador
      const playerStats = {};
      
      statsData?.forEach(stat => {
        if (!playerStats[stat.member_id]) {
          playerStats[stat.member_id] = {
            totalPoints: 0,
            totalRebounds: 0,
            totalAssists: 0,
            gamesPlayed: 0
          };
        }
        
        playerStats[stat.member_id].totalPoints += stat.points || 0;
        playerStats[stat.member_id].totalRebounds += stat.rebounds || 0;
        playerStats[stat.member_id].totalAssists += stat.assists || 0;
        playerStats[stat.member_id].gamesPlayed += 1;
      });

      // Crear array de jugadores con estadísticas
      const playersWithStats = playersData
        .map(player => {
          const stats = playerStats[player.id];
          if (!stats || stats.gamesPlayed === 0) return null;
          
          return {
             id: player.id,
             nombre: player.name,
             equipo: player.team?.team_name || "Sin equipo",
             foto: player.profile_pic_url,
             puntosPromedio: (stats.totalPoints / stats.gamesPlayed).toFixed(1),
             rebotesPromedio: (stats.totalRebounds / stats.gamesPlayed).toFixed(1),
             asistenciasPromedio: (stats.totalAssists / stats.gamesPlayed).toFixed(1),
             totalPoints: stats.totalPoints,
             totalRebounds: stats.totalRebounds,
             totalAssists: stats.totalAssists,
             gamesPlayed: stats.gamesPlayed
           };
        })
        .filter(player => player !== null);

      // Calcular líderes por categoría
      const puntosLeaders = [...playersWithStats]
        .sort((a, b) => parseFloat(b.puntosPromedio) - parseFloat(a.puntosPromedio))
        .slice(0, 4);
      
      const rebotesLeaders = [...playersWithStats]
        .sort((a, b) => parseFloat(b.rebotesPromedio) - parseFloat(a.rebotesPromedio))
        .slice(0, 4);
      
      const asistenciasLeaders = [...playersWithStats]
        .sort((a, b) => parseFloat(b.asistenciasPromedio) - parseFloat(a.asistenciasPromedio))
        .slice(0, 4);

      setLideres({
        puntos: {
           lider: puntosLeaders[0] ? {
             id: puntosLeaders[0].id,
             nombre: puntosLeaders[0].nombre,
             equipo: puntosLeaders[0].equipo,
             valor: puntosLeaders[0].puntosPromedio,
             foto: puntosLeaders[0].foto
           } : null,
           finalistas: puntosLeaders.slice(1, 4).map(player => ({
             id: player.id,
             nombre: player.nombre,
             equipo: player.equipo,
             valor: player.puntosPromedio,
             foto: player.foto
           }))
         },
        rebotes: {
           lider: rebotesLeaders[0] ? {
             id: rebotesLeaders[0].id,
             nombre: rebotesLeaders[0].nombre,
             equipo: rebotesLeaders[0].equipo,
             valor: rebotesLeaders[0].rebotesPromedio,
             foto: rebotesLeaders[0].foto
           } : null,
           finalistas: rebotesLeaders.slice(1, 4).map(player => ({
             id: player.id,
             nombre: player.nombre,
             equipo: player.equipo,
             valor: player.rebotesPromedio,
             foto: player.foto
           }))
         },
        asistencias: {
           lider: asistenciasLeaders[0] ? {
             id: asistenciasLeaders[0].id,
             nombre: asistenciasLeaders[0].nombre,
             equipo: asistenciasLeaders[0].equipo,
             valor: asistenciasLeaders[0].asistenciasPromedio,
             foto: asistenciasLeaders[0].foto
           } : null,
           finalistas: asistenciasLeaders.slice(1, 4).map(player => ({
             id: player.id,
             nombre: player.nombre,
             equipo: player.equipo,
             valor: player.asistenciasPromedio,
             foto: player.foto
           }))
         }
      });
      
    } catch (err) {
      console.error("Error fetching leaders data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const PlayerAvatar = ({ player, size = "w-20 h-20", textSize = "text-2xl" }) => {
    if (player.foto) {
      return (
        <img
          src={player.foto}
          alt={player.nombre}
          className={`${size} rounded-full object-cover border-2 border-white shadow-lg`}
        />
      );
    }
    
    return (
      <div className={`${size} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
        <span className={`${textSize} font-bold text-white`}>
          {getInitials(player.nombre)}
        </span>
      </div>
    );
  };

  const LeaderCard = ({ titulo, lider, finalistas, unidad = "" }) => (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">{titulo}</h3>
      </div>
      
      {/* Líder Principal */}
      {lider ? (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 mb-6 border-2 border-yellow-200">
          <div className="flex items-center justify-center mb-4 relative">
            <PlayerAvatar player={lider} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-lg">👑</span>
            </div>
          </div>
          <div className="text-center">
            <h4 
              className="text-xl font-bold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              onClick={() => navigate(`/jugador/${lider.id}`)}
            >
              {lider.nombre}
            </h4>
            <p className="text-amber-600 font-semibold mb-2">{lider.equipo}</p>
            <div className="text-3xl font-bold text-amber-700">
              {lider.valor}{unidad}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🏆</div>
            <p className="font-semibold">Por determinar</p>
          </div>
        </div>
      )}
      
      {/* Finalistas */}
      {finalistas && finalistas.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-lg font-semibold text-gray-700 text-center mb-4">Finalistas</h5>
          {finalistas.map((finalista, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <PlayerAvatar player={finalista} size="w-12 h-12" textSize="text-sm" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-bold text-white">{index + 2}</span>
                  </div>
                </div>
                <div>
                  <p 
                    className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                    onClick={() => navigate(`/jugador/${finalista.id}`)}
                  >
                    {finalista.nombre}
                  </p>
                  <p className="text-sm text-gray-600">{finalista.equipo}</p>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-700">
                {finalista.valor}{unidad}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🏆 Líderes del Torneo
          </h1>
          <p className="text-xl text-gray-600">
            Los mejores jugadores en cada categoría estadística
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Calculando líderes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error al cargar datos</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Líderes */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
            <LeaderCard 
              titulo="Puntos por Juego"
              lider={lideres.puntos.lider}
              finalistas={lideres.puntos.finalistas}
              unidad=" pts"
            />
            
            <LeaderCard 
              titulo="Rebotes por Juego"
              lider={lideres.rebotes.lider}
              finalistas={lideres.rebotes.finalistas}
              unidad=" reb"
            />
            
            <LeaderCard 
              titulo="Asistencias por Juego"
              lider={lideres.asistencias.lider}
              finalistas={lideres.asistencias.finalistas}
              unidad=" ast"
            />
          </div>
        )}

        {/* Sección de MVPs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LeaderCard 
            titulo="MVP del Torneo"
            lider={null}
            finalistas={null}
          />
          
          <LeaderCard 
            titulo="MVP de la Final"
            lider={null}
            finalistas={null}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8">
          <p className="text-gray-500 text-sm">
            Estadísticas actualizadas después de cada juego
          </p>
        </div>
      </div>
    </div>
  );
};

export default Lideres;
