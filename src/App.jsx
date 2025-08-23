import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Páginas
import Home from "./pages/Home";
import Calendario from "./pages/Calendario";
import Equipos from "./pages/Equipos";
import TeamProfile from "./pages/TeamProfile";
import PlayerProfile from "./pages/PlayerProfile";
import Jugadores from "./pages/Jugadores";
import Standings from "./pages/Standings";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import GameDetails from "./pages/GameDetails";
import Info from "./pages/Info";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/equipo/:id" element={<TeamProfile />} />
              <Route path="/jugador/:id" element={<PlayerProfile />} />
              <Route path="/jugadores" element={<Jugadores />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/partido/:id" element={<GameDetails />} />
              <Route path="/info" element={<Info />} />
            </Routes>
          </main>
          <footer className="bg-blue-800 text-white py-4">
            <div className="container mx-auto px-4 text-center">
              <p>
                © {new Date().getFullYear()} Liga de Baloncesto Adventista del
                Norte
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
