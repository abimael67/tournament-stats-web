import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

const TeamsTab = ({ handleAuthError }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    team_name: '',
    church_name: '',
    logo_url: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        
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

  const handleEditTeam = (team) => {
    setFormData({
      id: team.id,
      team_name: team.team_name,
      church_name: team.church_name,
      logo_url: team.logo_url || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const deleteTeam = async () => {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId);
        
        if (error) {
          // Verificar si es un error de autenticación
          const isAuthError = await handleAuthError(error);
          if (isAuthError) {
            // Reintentar después de refrescar el token
            return deleteTeam();
          }
          throw error;
        }
        
        // Actualizar la lista de equipos
        setTeams(teams.filter(team => team.id !== teamId));
      };
      
      // Ejecutar la función de eliminar
      await deleteTeam();
      
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('No se pudo eliminar el equipo. Inténtalo de nuevo.');
    }
  };

  const handleSubmitTeam = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    
    try {
      const saveTeam = async () => {
        if (isEditing) {
          // Actualizar equipo existente
          const { data, error } = await supabase
            .from('teams')
            .update({
              team_name: formData.team_name,
              church_name: formData.church_name,
              logo_url: formData.logo_url || null
            })
            .eq('id', formData.id)
            .select();
          
          if (error) {
            // Verificar si es un error de autenticación
            const isAuthError = await handleAuthError(error);
            if (isAuthError) {
              // Reintentar después de refrescar el token
              return saveTeam();
            }
            throw error;
          }
          
          // Actualizar la lista de equipos
          setTeams(teams.map(team => team.id === formData.id ? data[0] : team));
        } else {
          // Crear nuevo equipo
          const { data, error } = await supabase
            .from('teams')
            .insert([{
              team_name: formData.team_name,
              church_name: formData.church_name,
              logo_url: formData.logo_url || null
            }])
            .select();
          
          if (error) {
            // Verificar si es un error de autenticación
            const isAuthError = await handleAuthError(error);
            if (isAuthError) {
              // Reintentar después de refrescar el token
              return saveTeam();
            }
            throw error;
          }
          
          // Actualizar la lista de equipos
          setTeams([...teams, data[0]]);
        }
      };
      
      // Ejecutar la función de guardar
      await saveTeam();
      
      // Cerrar el modal y limpiar el formulario
      setShowModal(false);
      setFormData({ id: null, team_name: '', church_name: '', logo_url: '' });
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error saving team:', err);
      setFormError(`No se pudo ${isEditing ? 'actualizar' : 'crear'} el equipo. Inténtalo de nuevo.`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Cargando equipos...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Equipos</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Nuevo Equipo
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Iglesia</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No hay equipos registrados
                </td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={team.team_name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800" translate="no">{team.team_name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900" translate="no">{team.team_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.church_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditTeam(team)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar equipo */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h3>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmitTeam}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Equipo *
                  </label>
                  <input
                    type="text"
                    value={formData.team_name}
                    onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Iglesia *
                  </label>
                  <input
                    type="text"
                    value={formData.church_name}
                    onChange={(e) => setFormData({...formData, church_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Logo (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ id: null, team_name: '', church_name: '', logo_url: '' });
                      setIsEditing(false);
                      setFormError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    disabled={formLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsTab;