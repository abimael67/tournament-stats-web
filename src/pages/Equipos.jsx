import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabaseClient';

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
          .from('teams')
          .select('*')
          .order('team_name');

        if (error) throw error;
        
        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('No se pudieron cargar los equipos');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) return <div className="text-center py-10">Cargando equipos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Equipos Participantes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay equipos registrados</p>
          </div>
        ) : (
          teams.map(team => (
            <Link 
              to={`/equipo/${team.id}`} 
              key={team.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-40 bg-blue-50 flex items-center justify-center p-4">
                {team.logo_url ? (
                  <img 
                    src={team.logo_url} 
                    alt={team.team_name} 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-800" translate="no">{team.team_name.substring(0, 2)}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-bold text-blue-700" translate="no">{team.team_name}</h2>
                <p className="text-gray-600">{team.church_name}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Equipos;