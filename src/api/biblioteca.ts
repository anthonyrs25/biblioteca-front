import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

// ───── DOCENTES ─────

export const getDocenteByRfid = (uid: string) =>
  api.get(`/docentes/rfid/${uid}`).then(r => r.data)

export const getDocentes = () =>
  api.get('/docentes').then(r => r.data)

// ───── LIBROS ─────

export const getLibros = () =>
  api.get('/libros').then(r => r.data)

export const getLibroByCodigo = (codigo: string) =>
  api.get(`/libros/codigo/${codigo}`).then(r => r.data)

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
  libroId?: number
}) => api.post('/registros', data).then(r => r.data)

export const getStatsRegistros = (anio: number, mes: number) =>
  api.get(`/registros/stats/${anio}/${mes}`).then(r => r.data)