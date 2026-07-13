import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biblioteca_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ───── AUTH ─────

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

// ───── DOCENTES / USUARIOS ─────

export const getDocenteByRfid = (uid: string) =>
  api.get(`/docentes/rfid/${uid}`).then(r => r.data)

export const getDocentes = () =>
  api.get('/docentes').then(r => r.data)

export const actualizarDocente = (id: number, data: Partial<{
  rfid: string
  nombre: string
  iniciales: string
}>) => api.patch(`/docentes/${id}`, data).then(r => r.data)

export const crearDocente = (data: {
  nombre: string
  iniciales: string
  rfid?: string
  carreras?: { nombre: string; ciclos: { numero: number; materias: string[] }[] }[]
}) => api.post('/docentes', data).then(r => r.data)

export const actualizarCiclosDocente = (id: number, carrera: string, ciclos: { numero: number; materias: string[] }[]) =>
  api.patch(`/docentes/${id}/ciclos`, { carrera, ciclos }).then(r => r.data)

export const agregarCarreraDocente = (id: number, carrera: string) =>
  api.post(`/docentes/${id}/carreras`, { carrera }).then(r => r.data)

export const quitarCarreraDocente = (id: number, carrera: string) =>
  api.delete(`/docentes/${id}/carreras/${encodeURIComponent(carrera)}`).then(r => r.data)

// ───── VINCULACIÓN DE LLAVEROS RFID (sin tocar el firmware del ESP32) ─────

export const getUltimoEscaneoDesde = (desdeISO: string) =>
  api.get('/rfid/ultimo-escaneo', { params: { desde: desdeISO } }).then(r => r.data)

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

export const buscarLibros = (texto?: string, programa?: string) =>
  api.get('/libros/buscar', { params: { texto, programa } }).then(r => r.data)

export const getProgramas = () =>
  api.get('/libros/programas').then(r => r.data)

// ───── PRÉSTAMOS ─────

export const crearPrestamo = (docenteId: number, libroId: number, fechaDevolucionEsperada?: string) =>
  api.post('/prestamos', { docenteId, libroId, fechaDevolucionEsperada }).then(r => r.data)

export const devolverPrestamo = (prestamoId: number) =>
  api.patch(`/prestamos/devolver/${prestamoId}`).then(r => r.data)

export const getPrestamosActivos = () =>
  api.get('/prestamos/activos').then(r => r.data)

export const getTodosLosPrestamos = () =>
  api.get('/prestamos/todos').then(r => r.data)

// ───── REGISTROS ─────

export const crearRegistro = (data: {
  tipo: string
  usuarioId: number
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
export const getStatsPeriodo = (periodo: string) =>
  api.get('/registros/stats-periodo', { params: { periodo } }).then(r => r.data)

export const getComparativaAnual = () =>
  api.get('/registros/comparativa-anual').then(r => r.data)

export const getRegistrosMes = (anio: number, mes: number) =>
  api.get(`/registros/mes/${anio}/${mes}`).then(r => r.data)

export const getRankingVisitasUsuarios = (periodo?: string) =>
  api.get('/registros/ranking-usuarios', { params: { periodo } }).then(r => r.data)

// ───── EVENTOS PÚBLICOS (catálogo sin login) ─────

export const registrarEventoPublico = (data: {
  tipo: string // "visita_pagina" | "busqueda" | "clic_libro" | "clic_carrera"
  programa?: string
  texto?: string
  libroId?: number
}) => api.post('/eventos-publicos', data).then(r => r.data).catch(() => null)

export const getTotalVisitasPublicas = (periodo?: string) =>
  api.get('/eventos-publicos/total-visitas', { params: { periodo } }).then(r => r.data)

export const getLibrosMasBuscados = (periodo?: string) =>
  api.get('/eventos-publicos/libros-mas-buscados', { params: { periodo } }).then(r => r.data)

export const getCarrerasMasClickeadas = (periodo?: string) =>
  api.get('/eventos-publicos/carreras-mas-clickeadas', { params: { periodo } }).then(r => r.data)

export const getRankingPrestamosLibros = (periodo?: string) =>
  api.get('/prestamos/ranking-libros', { params: { periodo } }).then(r => r.data)

export const getRankingPrestamosUsuarios = (periodo?: string) =>
  api.get('/prestamos/ranking-usuarios', { params: { periodo } }).then(r => r.data)

export default api