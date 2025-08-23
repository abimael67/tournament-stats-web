const Info = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 relative overflow-hidden">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="https://ittjdadhzzieregopwba.supabase.co/storage/v1/object/public/imagenes_torneo/logo.png"
          alt="logo background"
          className="w-125 h-125 opacity-10 object-contain"
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              TORNEO BENÉFICO DE BALONCESTO 2025 🏀
            </h2>
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-3 mb-6">
              <span className="text-lg font-semibold text-gray-700">
                📍 Santiago, RD • 📅 Desde el 19 de julio
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Techado del Invi & Club G.U.G.
            </p>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-6 md:p-8 border-l-4 border-red-400">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              ❤️ Unidos por una causa que nos toca el corazón
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">
              Estamos organizando un torneo especial para recaudar fondos en
              favor de la madre de uno de nuestros jugadores, quien está
              luchando contra el cáncer. 🎗️ 🙏
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mt-4">
              Cada canasto, cada jugada y cada aplauso será por ella. 💪
            </p>
            <div className="mt-6 p-4 bg-white rounded-lg border border-red-200">
              <p className="text-gray-800 font-semibold text-center">
                💜 Apóyanos asistiendo, compartiendo o colaborando con lo que
                puedas.
              </p>
              <p className="text-gray-600 text-center mt-2">
                Todo suma, y el amor se nota en la acción.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              📞 Contacto
            </h3>
            <p className="text-lg text-gray-600">
              Para cualquier consulta, sugerencia o colaboración:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Card 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">AM</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  Ing. Abimael Martinez
                </h4>
                <p className="text-blue-600 font-semibold mb-3">
                  Developer & Administrador
                </p>
                <a
                  href="mailto:jamroa67@gmail.com"
                  className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  📧 Enviar Email
                </a>
              </div>
            </div>

            {/* Contact Card 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">FV</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  Freily Vargas
                </h4>
                <p className="text-purple-600 font-semibold mb-3">
                  Administrador
                </p>
                <a
                  href="mailto:freilyvargasgv@gmail.com"
                  className="inline-flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  📧 Enviar Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            © 2025 Liga de Baloncesto Adventista del Norte - Hecho con ❤️ por
            una buena causa
          </p>
        </div>
      </div>
    </div>
  );
};

export default Info;
