  export const getPositionName = (position) => {
    switch (position) {
      case 'point_guard':
        return 'Base';
      case 'shooting_guard':
        return 'Escolta';
      case 'small_forward':
        return 'Alero';
      case 'power_forward':
        return 'Alero de poder';
      case 'center':
        return 'Pívot';
      default:
        return 'Sin posición';
    }
  }