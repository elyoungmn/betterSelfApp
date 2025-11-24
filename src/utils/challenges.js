// Rutinas y hábitos por defecto
export const DEFAULT_ROUTINE_MORNING = [
  
  'Vaso de agua',
  'Respiración/meditación (3–5 min)',
  'Acomodar la cama',
  'Plan del día (3 prioridades)',
  'Movimiento ligero (5–10 min)'
];

export const DEFAULT_ROUTINE_NIGHT = [
  'Desconexión de pantallas 30 min antes',
  'Higiene nocturna',
  'Lectura 15 minutos',
  'Técnicas de respiración (5 min)',
  'Plan del día siguiente',
  'Gracias del día (3 cosas)'
];

export const DEFAULT_HABITS = [
  'Leer 15 minutos',
  'Ejercicio',
  'Técnicas de respiración',
  'Socializar',
  'Hidratarse',
  'Salir al aire libre'
];

const CHALLENGES = [
  'Enviar 1 mensaje de agradecimiento',
  'Toma 10.000 pasos',
  'Dedica 15 min a aprender algo nuevo',
  'Ordena un cajón o carpeta',
  'Cero redes sociales por 2 horas seguidas',
  'Haz 25 flexiones (o tu variante)',
  'Escribe 5 ideas de negocio',
  'Camina 20 minutos al aire libre',
  'Contacta a un amigo que no ves hace meses',
  'Lee un capítulo de tu libro'
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getDailyChallengeFor(key) {
  const idx = hashString(key) % CHALLENGES.length;
  return CHALLENGES[idx];
}