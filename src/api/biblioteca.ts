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

export const crearCuentaStaff = (data: { nombre: string; email: string; password: string; rol: string }) =>
  api.post('/auth/crear-cuenta', data).then(r => r.data)

// ───── USUARIOS (docentes, estudiantes, invitados y staff) ─────

export const getUsuarioByRfid = (uid: string) =>
  api.get(`/usuarios/rfid/${uid}`).then(r => r.data)

export const buscarPorEmail = (email: string) =>
  api.get(`/usuarios/email/${encodeURIComponent(email)}`).then(r => r.data)

export const buscarPorDocumento = (numero: string) =>
  api.get(`/usuarios/documento/${encodeURIComponent(numero)}`).then(r => r.data)

export const getUsuarios = (tipoPersona?: string) =>
  api.get('/usuarios', { params: { tipoPersona } }).then(r => r.data)

export const getCarreras = () =>
  api.get('/usuarios/carreras').then(r => r.data)

export const actualizarUsuario = (id: number, data: Partial<{
  rfid: string
  nombre: string
  iniciales: string
}>) => api.patch(`/usuarios/${id}`, data).then(r => r.data)

export const crearUsuario = (data: {
  nombre: string
  iniciales?: string
  rfid?: string
  email?: string
  tipoDocumento?: string
  numeroDocumento?: string
  rol?: string
  tipoPersona?: string
  carreras?: { nombre: string; ciclos: { numero: number; materias: string[]; jornada?: string }[] }[]
}) => api.post('/usuarios', data).then(r => r.data)

export const actualizarCiclosUsuario = (id: number, carrera: string, ciclos: { numero: number; materias: string[]; jornada?: string }[]) =>
  api.patch(`/usuarios/${id}/ciclos`, { carrera, ciclos }).then(r => r.data)

export const agregarCarreraUsuario = (id: number, carrera: string) =>
  api.post(`/usuarios/${id}/carreras`, { carrera }).then(r => r.data)

export const quitarCarreraUsuario = (id: number, carrera: string) =>
  api.delete(`/usuarios/${id}/carreras/${encodeURIComponent(carrera)}`).then(r => r.data)

export const cambiarRolUsuario = (id: number, rol: string) =>
  api.patch(`/usuarios/${id}/rol`, { rol }).then(r => r.data)

export const eliminarUsuario = (id: number) =>
  api.delete(`/usuarios/${id}`).then(r => r.data)

export const getPapeleraUsuarios = (tipoPersona?: string) =>
  api.get('/usuarios/papelera', { params: { tipoPersona } }).then(r => r.data)

export const restaurarUsuario = (id: number) =>
  api.patch(`/usuarios/${id}/restaurar`).then(r => r.data)

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

export const getPapeleraLibros = () =>
  api.get('/libros/papelera').then(r => r.data)

export const restaurarLibro = (id: number) =>
  api.patch(`/libros/${id}/restaurar`).then(r => r.data)

export const buscarLibros = (texto?: string, programa?: string, categoria?: string, orden?: string, direccion?: string) =>
  api.get('/libros/buscar', { params: { texto, programa, categoria, orden, direccion } }).then(r => r.data)

export const getCategorias = (programa?: string) =>
  api.get('/libros/categorias', { params: { programa } }).then(r => r.data)

export const getProgramas = () =>
  api.get('/libros/programas').then(r => r.data)

export const importarLoteLibros = (libros: any[]) =>
  api.post('/libros/importar-lote', { libros }).then(r => r.data)

export const exportarTodosLibros = () =>
  api.get('/libros/exportar-todos').then(r => r.data)

// ───── PRÉSTAMOS ─────

export const crearPrestamo = (usuarioId: number, libroId: number, fechaDevolucionEsperada: string | undefined, tipoDocumento: string, numeroDocumento?: string) =>
  api.post('/prestamos', { usuarioId, libroId, fechaDevolucionEsperada, tipoDocumento, numeroDocumento }).then(r => r.data)

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

export const getStatsPeriodo = (periodo: string, tipoPersona?: string, carrera?: string, materia?: string) =>
  api.get('/registros/stats-periodo', { params: { periodo, tipoPersona, carrera, materia } }).then(r => r.data)

export const getComparativaAnual = () =>
  api.get('/registros/comparativa-anual').then(r => r.data)

export const getComparativaPorTipo = (periodo: string) =>
  api.get('/registros/comparativa-por-tipo', { params: { periodo } }).then(r => r.data)

export const getMateriasDisponibles = () =>
  api.get('/registros/materias-disponibles').then(r => r.data)

export const getRegistrosMes = (anio: number, mes: number) =>
  api.get(`/registros/mes/${anio}/${mes}`).then(r => r.data)

export const getRankingVisitasUsuarios = (periodo?: string, tipoPersona?: string, carrera?: string, materia?: string) =>
  api.get('/registros/ranking-usuarios', { params: { periodo, tipoPersona, carrera, materia } }).then(r => r.data)

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

export const getRankingPrestamosUsuarios = (periodo?: string, tipoPersona?: string) =>
  api.get('/prestamos/ranking-usuarios', { params: { periodo, tipoPersona } }).then(r => r.data)

export default api