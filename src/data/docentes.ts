// CÓMO AGREGAR UN DOCENTE:
// Copia un bloque y pega al final del array.
// El 'rfid' debe ser único.

export interface Materia {
  nombre: string
}

export interface Ciclo {
  numero: number
  materias: Materia[]
}

export interface Carrera {
  nombre: string
  ciclos: Ciclo[]
}

export interface Docente {
  rfid: string
  nombre: string
  iniciales: string
  carreras: Carrera[]
  prestamosActivos: number
}

export const docentes: Docente[] = [
  {
    rfid: 'RFID-001',
    nombre: 'Ing. Paul Tigre',
    iniciales: 'PT',
    prestamosActivos: 0,
    carreras: [
      {
        nombre: 'Desarrollo de Software',
        ciclos: [
          {
            numero: 1,
            materias: [
              { nombre: 'Fundamentos de Programación' },
              { nombre: 'Introducción a la Ingeniería' },
            ],
          },
          {
            numero: 2,
            materias: [
              { nombre: 'Proyecto Integrador de Saberes' },
              { nombre: 'Sistemas Digitales Programables' },
            ],
          },
          {
            numero: 3,
            materias: [
              { nombre: 'Programación Orientada a Objetos' },
              { nombre: 'Base de Datos' },
            ],
          },
          {
            numero: 4,
            materias: [
              { nombre: 'Desarrollo Web' },
              { nombre: 'Estructura de Datos' },
            ],
          },
        ],
      },
      {
        nombre: 'Redes y Telecomunicaciones',
        ciclos: [
          {
            numero: 1,
            materias: [
              { nombre: 'Fundamentos de Redes' },
              { nombre: 'Introducción a Telecomunicaciones' },
            ],
          },
          {
            numero: 2,
            materias: [
              { nombre: 'Protocolos de Red' },
              { nombre: 'Sistemas Operativos' },
            ],
          },
        ],
      },
    ],
  },
]