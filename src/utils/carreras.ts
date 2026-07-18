// Traduce el nombre largo institucional de un programa (tal como viene en el
// Excel oficial, ej. "TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE") a un
// nombre corto para mostrar en pantalla. Antes esta tabla vivía copiada en
// 3 archivos distintos (Landing, Catalogo, Reportes) — centralizada aquí para
// que solo haya un lugar que actualizar si el instituto agrega una carrera nueva.
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
}

export const nombreCortoPrograma = (nombreLargo: string): string =>
  NOMBRE_CORTO_PROGRAMA[nombreLargo] || nombreLargo