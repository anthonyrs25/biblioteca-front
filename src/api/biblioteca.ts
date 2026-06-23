import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

// ───── DOCENTES ─────

export const getDocenteByRfid = (uid: string) =>
  api.get(`/docentes/rfid/${uid}`).then(r => r.data)

export const getDocentes = () =>
  api.get('/docentes').then(r => r.data)

export const actualizarDocente = (id: number, data: Partial<{
  rfid: string
  nombre: string
  iniciales: string
}>) => api.patch(`/docentes/${id}`, data).then(r => r.data)

// ───── LIBROS ─────

export const getLibros = () =>
  api.get('/libros').then(r => r.data)

export const getLibroByCodigo = (codigo: string) =>
  api.get(`/libros/codigo/${codigo}`).then(r => r.data)

export const getConteoPorPrograma = () =>
  api.get('/libros/conteo-por-programa').then(r => r.data)

export const crearLibro = (data: {
  codigo: string
  titulo: string
  autor: string
  anio: number
  categoria: string
  totalEjemplares: number
  disponibles: number
  descripcion: string
}) => api.post('/libros', data).then(r => r.data)

export const actualizarLibro = (id: number, data: Partial<{
  titulo: string
  autor: string
  anio: number
  categoria: string
  totalEjemplares: number
  disponibles: number
  descripcion: string
}>) => api.patch(`/libros/${id}`, data).then(r => r.data)

export const eliminarLibro = (id: number) =>
  api.delete(`/libros/${id}`).then(r => r.data)

// ───── PRÉSTAMOS ─────

export const crearPrestamo = (docenteId: number, libroId: number) =>
  api.post('/prestamos', { docenteId, libroId }).then(r => r.data)

export const devolverPrestamo = (prestamoId: number) =>
  api.patch(`/prestamos/devolver/${prestamoId}`).then(r => r.data)

// ───── REGISTROS ─────

export const crearRegistro = (data: {
  tipo: string
  docenteId: number
  actividad?: string
  detalle?: string
  carrera?: string
  ciclo?: number
  materia?: string
  jornada?: string
  libroId?: number
}) => api.post('/registros', data).then(r => r.data)

export const getStatsRegistros = (anio: number, mes: number) =>
  api.get(`/registros/stats/${anio}/${mes}`).then(r => r.data)

export const buscarLibros = (texto?: string, programa?: string) =>
  api.get('/libros/buscar', { params: { texto, programa } }).then(r => r.data)

export const getProgramas = () =>
  api.get('/libros/programas').then(r => r.data)