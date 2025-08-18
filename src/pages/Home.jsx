import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Torneo de Baloncesto entre Iglesias</h1>
        <p className="text-xl text-gray-600">Estadísticas, calendario y más información sobre el torneo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/calendario" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Calendario</h2>
          <p className="text-gray-600">Consulta los próximos partidos y resultados anteriores</p>
        </Link>

        <Link to="/equipos" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Equipos</h2>
          <p className="text-gray-600">Conoce los equipos participantes y sus jugadores</p>
        </Link>

        <Link to="/jugadores" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Jugadores</h2>
          <p className="text-gray-600">Busca jugadores y consulta sus estadísticas</p>
        </Link>

        <Link to="/standings" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Standings</h2>
          <p className="text-gray-600">Tabla de posiciones actualizada</p>
        </Link>
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Próximos Partidos</h2>
        <div className="space-y-4">
          {/* Estos serían datos de ejemplo que vendrían de Supabase */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Iglesia Emanuel</div>
              <div className="text-gray-500">vs</div>
              <div className="font-semibold">Iglesia Bethel</div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">Domingo, 30 de Agosto - 15:00</div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Iglesia Nueva Vida</div>
              <div className="text-gray-500">vs</div>
              <div className="font-semibold">Iglesia Luz del Mundo</div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">Sábado, 5 de Septiembre - 16:30</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;