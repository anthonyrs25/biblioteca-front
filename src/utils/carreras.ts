// Traduce el nombre largo institucional de un programa (tal como viene en el
// Excel oficial, ej. "TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE") a un
// nombre corto y prolijo para mostrar en pantalla. Antes esta tabla vivía
// copiada en 3 archivos distintos (Landing, Catalogo, Reportes) — centralizada
// aquí para que solo haya un lugar que actualizar.

// Nombres cortos "curados" para los programas conocidos. Tienen prioridad:
// si el programa está aquí, se usa exactamente este texto.
export const NOMBRE_CORTO_PROGRAMA: Record<string, string> = {
  'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE': 'Desarrollo de Software',
  'TECNOLOGÍA SUPERIOR EN MARKETING': 'Marketing Digital y Negocios',
  'TECNOLOGÍA SUPERIOR EN GASTRONOMÍA': 'Gastronomía',
  'DISEÑO GRÁFICO CON NIVEL EQUIVALENTE A TECNOLOGÍA SUPERIOR': 'Diseño Gráfico',
  'TECNOLOGÍA SUPERIOR EN TURISMO': 'Turismo',
  'ENFERMERÍA': 'Enfermería',
  'CONTABILIDAD Y ASESORIA TRIBUTARIA': 'Contabilidad y Asesoría Tributaria',
  'REDES Y TELECOMUNICACIONES': 'Redes y Telecomunicaciones',
  'ELECTRICIDAD': 'Electricidad',
  'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN DEL TALENTO HUMANO': 'Talento Humano',
  'EDUCACIÓN CONTINUA': 'Educación Continua',
}

// Prefijos institucionales que no aportan nada al nombre visible y conviene
// quitar. Se comparan sin distinguir mayúsculas/tildes. Agregar aquí cualquier
// variante nueva que aparezca (ej. "TECNÓLOGO SUPERIOR EN", "TÉCNICO EN").
const PREFIJOS_A_QUITAR = [
  'TECNOLOGÍA SUPERIOR EN',
  'TECNOLOGIA SUPERIOR EN',
  'TECNÓLOGO SUPERIOR EN',
  'TECNOLOGO SUPERIOR EN',
  'TECNICO SUPERIOR EN',
  'TÉCNICO SUPERIOR EN',
]

// Sufijos institucionales que tampoco aportan al nombre visible.
const SUFIJOS_A_QUITAR = [
  'CON NIVEL EQUIVALENTE A TECNOLOGÍA SUPERIOR',
  'CON NIVEL EQUIVALENTE A TECNOLOGIA SUPERIOR',
]

// Palabras que deben ir en minúscula aunque no sean la primera (conectores).
const MINUSCULAS = new Set(['y', 'de', 'del', 'la', 'el', 'en', 'a', 'con', 'e', 'los', 'las'])

// Pasa un texto a "Primera Mayúscula, resto minúsculas" respetando conectores,
// para que "CONTABILIDAD Y ASESORÍA" quede "Contabilidad y Asesoría" como los demás.
function aFormatoTitulo(texto: string): string {
  const palabras = texto.toLowerCase().trim().split(/\s+/)
  return palabras
    .map((palabra, i) => {
      if (i > 0 && MINUSCULAS.has(palabra)) return palabra
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .join(' ')
}

// Quita acentos para comparar (no para mostrar).
const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Devuelve el nombre corto y prolijo de un programa. Primero busca en la tabla
// curada; si no está (o viene con un prefijo/formato inesperado), lo limpia
// automáticamente: quita prefijos/sufijos institucionales y aplica formato
// título. Así cualquier variante rara ("TECNÓLOGO SUPERIOR EN...", TODO EN
// MAYÚSCULAS) se muestra igual de prolija que las demás, sin tener que
// registrarla a mano.
export const nombreCortoPrograma = (nombreLargo: string): string => {
  if (!nombreLargo) return ''

  // 1. Coincidencia exacta en la tabla curada
  if (NOMBRE_CORTO_PROGRAMA[nombreLargo]) return NOMBRE_CORTO_PROGRAMA[nombreLargo]

  // 2. Coincidencia ignorando mayúsculas/tildes con la tabla curada
  const claveNorm = sinAcentos(nombreLargo).toUpperCase().trim()
  for (const [largo, corto] of Object.entries(NOMBRE_CORTO_PROGRAMA)) {
    if (sinAcentos(largo).toUpperCase().trim() === claveNorm) return corto
  }

  // 3. Limpieza automática: quitar prefijos y sufijos institucionales
  let limpio = nombreLargo.trim()
  for (const prefijo of PREFIJOS_A_QUITAR) {
    const norm = sinAcentos(limpio).toUpperCase()
    if (norm.startsWith(sinAcentos(prefijo).toUpperCase())) {
      limpio = limpio.slice(prefijo.length).trim()
      break
    }
  }
  for (const sufijo of SUFIJOS_A_QUITAR) {
    const norm = sinAcentos(limpio).toUpperCase()
    if (norm.endsWith(sinAcentos(sufijo).toUpperCase())) {
      limpio = limpio.slice(0, limpio.length - sufijo.length).trim()
      break
    }
  }

  // 4. Formato título prolijo
  return aFormatoTitulo(limpio)
}
