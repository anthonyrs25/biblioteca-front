// Normalización de nombres de materias al guardar: recorta espacios,
// colapsa espacios dobles, pone mayúscula inicial y elimina duplicados
// exactos. Evita que "programacion ", " Programacion" y "programacion"
// se conviertan en tres materias distintas que fragmentan los reportes.

export const normalizarMateria = (m: string): string => {
  const limpio = m.replace(/\s+/g, ' ').trim()
  if (!limpio) return ''
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

export const normalizarMaterias = (lista: string[]): string[] =>
  [...new Set(lista.map(normalizarMateria).filter(Boolean))]