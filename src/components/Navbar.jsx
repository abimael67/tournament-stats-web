import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../lib/supabase/supabaseClient';

const Navbar = () => {
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Torneo Inter-Iglesias 2025</Link>
         <div className="flex space-x-6">
          <Link to="/calendario" className="hover:text-blue-200">Calendario</Link>
          <Link to="/equipos" className="hover:text-blue-200">Equipos</Link>
          <Link to="/jugadores" className="hover:text-blue-200">Jugadores</Link>
          <Link to="/standings" className="hover:text-blue-200">Standings</Link>
          <Link to="/info" className="hover:text-blue-200">Info</Link>
        </div>

        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin" className="text-yellow-300 hover:text-yellow-100">
                  Panel Admin
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;