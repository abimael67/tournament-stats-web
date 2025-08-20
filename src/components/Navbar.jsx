import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../lib/supabase/supabaseClient';

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold" translate="no">Torneo Inter-Iglesias 2025</Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link to="/calendario" className="hover:text-blue-200">Calendario</Link>
            <Link to="/equipos" className="hover:text-blue-200">Equipos</Link>
            <Link to="/jugadores" className="hover:text-blue-200">Jugadores</Link>
            <Link to="/standings" className="hover:text-blue-200">Standings</Link>
            <Link to="/info" className="hover:text-blue-200">Info</Link>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:block">
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex flex-col justify-center items-center w-6 h-6 space-y-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="pt-4 pb-2 space-y-2">
            <Link 
              to="/calendario" 
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Calendario
            </Link>
            <Link 
              to="/equipos" 
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Equipos
            </Link>
            <Link 
              to="/jugadores" 
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Jugadores
            </Link>
            <Link 
              to="/standings" 
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Standings
            </Link>
            <Link 
              to="/info" 
              className="block py-2 px-4 hover:bg-blue-700 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Info
            </Link>
            
            {/* Mobile Auth Section */}
            <div className="pt-2 border-t border-blue-700">
              {user ? (
                <div className="space-y-2">
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="block py-2 px-4 text-yellow-300 hover:bg-blue-700 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-4 bg-red-600 hover:bg-red-700 rounded"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="block py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;