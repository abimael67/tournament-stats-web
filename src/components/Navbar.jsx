import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2" translate="no">
            <Link to="/" className="text-xl font-bold" translate="no">
              <img
                src="https://ittjdadhzzieregopwba.supabase.co/storage/v1/object/public/imagenes_torneo/logo.png"
                alt="logo"
                className="w-16 h-16"
              />
            </Link>
            <Link to="/" className="text-xl font-bold" translate="no">
              Liga de Baloncesto Adventista del Norte
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link to="/calendario" className="hover:text-blue-200">
              Calendario
            </Link>
            <Link to="/equipos" className="hover:text-blue-200">
              Equipos
            </Link>
            <Link to="/jugadores" className="hover:text-blue-200">
              Jugadores
            </Link>
            <Link to="/standings" className="hover:text-blue-200">
              Standings
            </Link>
            <Link to="/lideres" className="hover:text-blue-200">
              Líderes
            </Link>
            <Link to="/info" className="hover:text-blue-200">
              Info
            </Link>
            {user && isAdmin() && (
              <Link
                to="/admin"
                className="text-yellow-300 hover:text-yellow-100"
              >
                Panel Admin
              </Link>
            )}
            {!user && (
              <Link to="/login" className="text-green-300 hover:text-green-100">
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
            <span
              className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${
                isMenuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-white transition-opacity duration-300 ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-white transition-transform duration-300 ${
                isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            ></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
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
            {user && isAdmin() && (
              <Link
                to="/admin"
                className="block py-2 px-4 text-yellow-300 hover:bg-blue-700 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Panel Admin
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="block py-2 px-4 text-green-300 hover:bg-blue-700 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
