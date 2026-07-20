// Tokens RFID "generales": no pertenecen a ninguna persona.
// Al acercarlos al lector, abren el Registro Manual directo en el
// paso indicado, donde se identifica a la persona real (así los
// reportes nunca registran actividad a nombre de usuarios genéricos).
//
// Para agregar otro token (ej. un futuro llavero "Docentes"):
// agrega su UID (mayúsculas, sin espacios) con el paso deseado.

export type PasoSelector = 'docente' | 'estudiante' | 'invitado'

export const LLAVEROS_GENERALES: Record<string, PasoSelector> = {
  '738F1492': 'estudiante', // llavero 5 — acceso general de estudiantes
  'B943AA14': 'invitado',   // tarjeta — acceso general de invitados/externos
}