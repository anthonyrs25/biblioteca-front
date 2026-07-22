// Normalización de nombres de materias. Debe coincidir EXACTAMENTE con la
// función del backend (usuarios.service.ts): si difieren, lo que el usuario
// escribe no coincide con lo que se guarda, y las sugerencias fallan.
// Regla: espacios colapsados y cada palabra con mayúscula inicial.
// "base de datos" y "BASE DE DATOS" -> "Base De Datos"

export const normalizarMateria = (m: string): string =>
  m
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ')

// Además de normalizar, elimina duplicados exactos de la lista.
export const normalizarMaterias = (lista: string[]): string[] =>
  [...new Set(lista.map(normalizarMateria).filter(Boolean))]