// Las iniciales solo se usan como avatar visual al identificar a una persona.
// Se calculan del nombre en vez de pedírselas al bibliotecario en cada registro.
// "Telmo Durazno Silva" -> "TD"  ·  "Ana" -> "AN"
export const calcularIniciales = (nombre: string): string => {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

// Pasa un texto a MAYÚSCULAS conservando tildes y ñ, colapsando espacios.
export const aMayusculas = (texto?: string): string =>
  (texto ?? '').replace(/\s+/g, ' ').trim().toUpperCase()

// Formato institucional del nombre: APELLIDOS NOMBRES, en mayúsculas y con
// tildes. Si falta uno de los dos, usa el que haya sin fallar.
export const componerNombre = (apellidos?: string, nombres?: string): string =>
  [aMayusculas(apellidos), aMayusculas(nombres)].filter(Boolean).join(' ')

// Iniciales a partir de apellidos y nombres separados: primera letra del
// primer apellido + primera letra del primer nombre. "PÉREZ GARCÍA / JUAN
// CARLOS" -> "PJ". Si falta uno, cae a las dos primeras letras del que haya.
export const inicialesDe = (apellidos?: string, nombres?: string): string => {
  const a = (apellidos ?? '').trim().split(/\s+/).filter(Boolean)
  const n = (nombres ?? '').trim().split(/\s+/).filter(Boolean)
  if (a.length && n.length) return (a[0][0] + n[0][0]).toUpperCase()
  const unico = a.length ? a : n
  if (!unico.length) return '?'
  if (unico.length === 1) return unico[0].slice(0, 2).toUpperCase()
  return (unico[0][0] + unico[1][0]).toUpperCase()
}
