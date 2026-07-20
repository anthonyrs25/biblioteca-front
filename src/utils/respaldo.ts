import * as XLSX from 'xlsx'
import {
  exportarTodosPrestamos, exportarTodosRegistros,
  getUsuarios, exportarTodosLibros,
} from '../api/biblioteca'

const ETIQUETA_TIPO: Record<string, string> = {
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  INVITADO: 'Invitado',
  STAFF: 'Staff',
}

const ETIQUETA_REGISTRO: Record<string, string> = {
  uso: 'Uso de sala',
  prestamo: 'Préstamo',
  devolucion: 'Devolución',
}

const fecha = (f?: string | null) =>
  f ? new Date(f).toLocaleDateString('es-EC') : ''

const fechaHora = (f?: string | null) =>
  f ? `${new Date(f).toLocaleDateString('es-EC')} ${new Date(f).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}` : ''

// Ajusta el ancho de las columnas al contenido más largo de cada una,
// para que el archivo se pueda leer sin tener que arrastrar bordes.
const anchoColumnas = (filas: any[]) => {
  if (filas.length === 0) return []
  return Object.keys(filas[0]).map(clave => {
    const largos = filas.map(f => String(f[clave] ?? '').length)
    return { wch: Math.min(Math.max(clave.length, ...largos) + 2, 50) }
  })
}

const agregarHoja = (libro: XLSX.WorkBook, nombre: string, filas: any[]) => {
  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = anchoColumnas(filas)
  XLSX.utils.book_append_sheet(libro, hoja, nombre)
}

// Descarga un respaldo completo del sistema en un solo archivo .xlsx,
// con una hoja por cada conjunto de datos. Pensado como red de seguridad:
// si la base de datos deja de estar disponible, esto conserva el historial.
export async function descargarRespaldoExcel() {
  const [prestamos, registros, usuarios, libros] = await Promise.all([
    exportarTodosPrestamos(),
    exportarTodosRegistros(),
    getUsuarios(),
    exportarTodosLibros(),
  ])

  const filasPrestamos = prestamos.map((p: any, i: number) => ({
    'N°': i + 1,
    'Fecha préstamo': fecha(p.fechaPrestamo),
    'Nombre': p.usuario?.nombre ?? '',
    'Tipo': ETIQUETA_TIPO[p.usuario?.tipoPersona] ?? p.usuario?.tipoPersona ?? '',
    'Correo': p.usuario?.email ?? '',
    'Libro': p.libro?.titulo ?? '',
    'Autor': p.libro?.autor ?? '',
    'Código': p.libro?.codigo ?? '',
    'Devolución esperada': fecha(p.fechaDevolucionEsperada),
    'Fecha devolución': fecha(p.fechaDevolucion),
    'Estado': p.activo ? 'Activo' : 'Devuelto',
    'Documento en garantía': p.numeroDocumento
      ? `${p.tipoDocumento ?? ''} ${p.numeroDocumento}`.trim()
      : '',
  }))

  const filasRegistros = registros.map((r: any, i: number) => ({
    'N°': i + 1,
    'Fecha y hora': fechaHora(r.fecha),
    'Nombre': r.usuario?.nombre ?? '',
    'Tipo de persona': ETIQUETA_TIPO[r.usuario?.tipoPersona] ?? r.usuario?.tipoPersona ?? '',
    'Tipo de registro': ETIQUETA_REGISTRO[r.tipo] ?? r.tipo,
    'Actividad': r.actividad ?? '',
    'Detalle': r.detalle ?? '',
    'Carrera': r.carrera ?? '',
    'Ciclo': r.ciclo ?? '',
    'Jornada': r.jornada ?? '',
    'Materia': r.materia ?? '',
  }))

  const filasUsuarios = usuarios.map((u: any, i: number) => ({
    'N°': i + 1,
    'Nombre': u.nombre ?? '',
    'Tipo': ETIQUETA_TIPO[u.tipoPersona] ?? u.tipoPersona ?? '',
    'Correo': u.email ?? '',
    'Iniciales': u.iniciales ?? '',
    'RFID': u.rfid ?? '',
    'Documento': u.numeroDocumento
      ? `${u.tipoDocumento ?? ''} ${u.numeroDocumento}`.trim()
      : '',
    'Carreras': (u.carreras ?? [])
      .map((dc: any) => dc.carrera?.nombre)
      .filter(Boolean)
      .join(' | '),
    'Ciclos': (u.carreras ?? [])
      .flatMap((dc: any) => (dc.ciclos ?? []).map((c: any) => `${c.numero}° ${c.jornada ?? ''}`.trim()))
      .join(' | '),
    'Materias': (u.carreras ?? [])
      .flatMap((dc: any) => (dc.ciclos ?? []).flatMap((c: any) => (c.materias ?? []).map((m: any) => m.nombre)))
      .join(' | '),
    'Préstamos activos': u.prestamosActivos ?? 0,
    'Rol': u.rol ?? '',
  }))

  const filasLibros = libros.map((l: any, i: number) => ({
    'N°': i + 1,
    'Código': l.codigo ?? '',
    'Título': l.titulo ?? '',
    'Autor': l.autor ?? '',
    'Año': l.anio ?? '',
    'Categoría': l.categoria ?? '',
    'Programa': l.programa ?? '',
    'Editorial': l.editorial ?? '',
    'ISBN': l.isbn ?? '',
    'Total ejemplares': l.totalEjemplares ?? 0,
    'Disponibles': l.disponibles ?? 0,
    'Solo en sala': l.soloEnSala ? 'Sí' : 'No',
  }))

  const libro = XLSX.utils.book_new()
  agregarHoja(libro, 'Préstamos', filasPrestamos)
  agregarHoja(libro, 'Registros de uso', filasRegistros)
  agregarHoja(libro, 'Usuarios', filasUsuarios)
  agregarHoja(libro, 'Libros', filasLibros)

  const hoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(libro, `respaldo-biblioteca-${hoy}.xlsx`)

  return {
    prestamos: filasPrestamos.length,
    registros: filasRegistros.length,
    usuarios: filasUsuarios.length,
    libros: filasLibros.length,
  }
}