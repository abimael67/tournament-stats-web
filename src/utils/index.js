export const getPositionName = (position) => {
  switch (position) {
    case "point_guard":
      return "Base";
    case "shooting_guard":
      return "Escolta";
    case "small_forward":
      return "Alero";
    case "power_forward":
      return "Alero de poder";
    case "center":
      return "Pívot";
    default:
      return "Sin posición";
  }
};

export const getTeamDivision = (teamName) => {
  switch (teamName) {
    case "Centinelas":
      return "División A";
    case "Libertad":
      return "División A";
    case "Central":
      return "División B";
    case "Belén":
      return "División B";
    case "Alfa":
      return "División B";
    case "Guardianes de Bethel":
      return "División B";
    case "300 de Gedeón":
      return "División A";
    case "Sion":
      return "División A";
    default:
      return "Sin división";
  }
};

export const getGameStatus = (gameStatus) => {
  switch (gameStatus) {
    case "completed":
      return "Completado";
    case "pending":
      return "Pendiente";
    case "invalid":
      return "Nulo";
    case "in_progress":
      return "En Progreso";
    case "postponed":
      return "Pospuesto";
    default:
      return "Pendiente";
  }
};
