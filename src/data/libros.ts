// CÓMO AGREGAR UN LIBRO:
// Copia un bloque y pega al final del array.
// Cambia los valores. El 'codigo' debe ser único.

export interface Libro {
  codigo: string
  titulo: string
  autor: string
  anio: number
  categoria: string
  totalEjemplares: number
  disponibles: number
  descripcion: string
}

export const libros: Libro[] = [
  {
    codigo: 'LIB-001',
    titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    autor: 'Robert C. Martin',
    anio: 2008,
    categoria: 'Programación',
    totalEjemplares: 3,
    disponibles: 2,
    descripcion: 'Guía esencial para escribir código limpio, legible y mantenible. Imprescindible para todo desarrollador de software.',
  },
]