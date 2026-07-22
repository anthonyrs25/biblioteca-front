// Las iniciales solo se usan como avatar visual al identificar a una persona.
// Se calculan del nombre en vez de pedírselas al bibliotecario en cada registro.
// "Telmo Durazno Silva" -> "TD"  ·  "Ana" -> "AN"
export const calcularIniciales = (nombre: string): string => {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}