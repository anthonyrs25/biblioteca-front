// CÓMO AGREGAR UN DOCENTE:
// Copia un bloque y pega al final del array.
// El 'rfid' debe ser único — es el ID de la tarjeta física.

export interface Docente {
  rfid: string
  nombre: string
  carrera: string
  iniciales: string
  prestamosActivos: number
}

export const docentes: Docente[] = [
  {
    rfid: 'RFID-001',
    nombre: 'Ing. Paul Tigre',
    carrera: 'Desarrollo de Software',
    iniciales: 'PT',
    prestamosActivos: 0,
  },
]