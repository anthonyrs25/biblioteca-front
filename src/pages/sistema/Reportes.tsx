import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Statistic, Progress, Tabs, Table, Tag, Select, DatePicker, Button, App } from 'antd'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ArrowLeftOutlined, BarChartOutlined, TeamOutlined,
  SwapOutlined, CheckCircleOutlined, BookOutlined, DownloadOutlined,
  PrinterOutlined, FileTextOutlined, FilePdfOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { getStatsPeriodo, getComparativaAnual, getComparativaPorTipo, getLibros, getRegistrosMes, getTodosLosPrestamos, getUsuarios, getTotalVisitasPublicas, getLibrosMasBuscados, getCarrerasMasClickeadas, getRankingVisitasUsuarios, getRankingPrestamosLibros, getRankingPrestamosUsuarios, getMateriasDisponibles, getCarreras, exportarTodosPrestamos, exportarTodosRegistros } from '../../api/biblioteca'
import { nombreCortoPrograma } from '../../utils/carreras'
import { descargarRespaldoExcel } from '../../utils/respaldo'
import {
  imprimirPlantillaUso, imprimirPlantillaPrestamos,
  imprimirRegistrosUso, imprimirPrestamos, imprimirReporteGestion,
} from '../../utils/impresion'
import type { TipoHoja } from '../../utils/impresion'
import { escucharDatosActualizados } from '../../utils/refresco'

type TabKey = 'resumen' | 'visitas' | 'prestamos' | 'analitica'

// ── Paleta turquesa institucional ──
// Antes se usaban verdes petróleo (#00695C, #004D40) que no corresponden
// al color de marca del Instituto Sudamericano.
const MARCA = '#00A9A5'
const MARCA_OSCURO = '#007D7A'
const MARCA_MEDIO = '#4FC3C0'
const MARCA_CLARO = '#85D6D3'
const MARCA_FONDO = '#E6F7F6'
const MARCA_BORDE = '#9FDEDC'
const TEXTO = '#12303A'
const TEXTO_SUAVE = '#5A7480'
const TEXTO_TENUE = '#8FA5AE'

const COLORES_GRAFICO = [MARCA_OSCURO, MARCA, MARCA_MEDIO, MARCA_CLARO, '#B5E6E4', '#00918D', '#2FB5B2', '#6BCECB']

const ETIQUETA_TIPO: Record<string, string> = {
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  INVITADO: 'Invitado',
}

const OPCIONES_TIPO_HOJA = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'DOCENTE', label: 'Docentes' },
  { value: 'ESTUDIANTE', label: 'Estudiantes' },
  { value: 'INVITADO', label: 'Invitados' },
]

const OPCIONES_ALCANCE = [
  { value: 'mes', label: 'Mes seleccionado' },
  { value: 'todo', label: 'Todo el historial' },
]

// Estilos compartidos de las barras de herramientas
const estiloBarra: React.CSSProperties = {
  display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
  marginBottom: 18, padding: '14px 18px',
  background: MARCA_FONDO, borderRadius: 12, border: `1px solid ${MARCA_BORDE}`,
}

const estiloFiltros: React.CSSProperties = {
  display: 'flex', gap: 14, flexWrap: 'wrap',
  marginBottom: 18, padding: '14px 18px',
  background: '#FFFFFF', borderRadius: 12, border: '1px solid #DCE8EA',
}

const etiquetaFiltro: React.CSSProperties = {
  fontSize: 13, color: TEXTO_SUAVE, fontWeight: 600,
}

function Reportes() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'resumen'
  )
  const [stats, setStats] = useState<any>(null)
  const [totalLibros, setTotalLibros] = useState(0)
  const [disponibles, setDisponibles] = useState(0)
  const [registros, setRegistros] = useState<any[]>([])
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [anio, setAnio] = useState(dayjs().year())
  const [mes, setMes] = useState(dayjs().month() + 1)
  const [usuarioFiltro, setUsuarioFiltro] = useState<number | undefined>()
  const [soloActivos, setSoloActivos] = useState(false)
  const [tipoHoja, setTipoHoja] = useState<TipoHoja>('TODOS')
  const [alcanceHoja, setAlcanceHoja] = useState<'mes' | 'todo'>('mes')
  const [visitasPublicas, setVisitasPublicas] = useState(0)
  const [librosMasBuscados, setLibrosMasBuscados] = useState<any[]>([])
  const [rankingVisitas, setRankingVisitas] = useState<any[]>([])
  const [rankingLibros, setRankingLibros] = useState<any[]>([])
  const [rankingPrestamosUsuarios, setRankingPrestamosUsuarios] = useState<any[]>([])
  const [rankingCarreras, setRankingCarreras] = useState<any[]>([])
  const [cargandoAnalitica, setCargandoAnalitica] = useState(true)
  const [periodoAnalitica, setPeriodoAnalitica] = useState<string>('todo')
  const [periodoResumen, setPeriodoResumen] = useState<string>('mes')
  const [comparativaAnual, setComparativaAnual] = useState<any[]>([])
  const [comparativaPorTipo, setComparativaPorTipo] = useState<any[]>([])
  const [tipoUsuarioResumen, setTipoUsuarioResumen] = useState<string | undefined>()
  const [tipoUsuarioAnalitica, setTipoUsuarioAnalitica] = useState<string | undefined>()
  const [carreraAnalitica, setCarreraAnalitica] = useState<string | undefined>()
  const [materiaAnalitica, setMateriaAnalitica] = useState<string | undefined>()
  const [carreraResumen, setCarreraResumen] = useState<string | undefined>()
  const [materiaResumen, setMateriaResumen] = useState<string | undefined>()
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([])
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])
  const [alcanceReporte, setAlcanceReporte] = useState<'mes' | 'todo'>('mes')

  const mesNombre = dayjs(`${anio}-${String(mes).padStart(2, '0')}-01`)
    .toDate().toLocaleString('es-EC', { month: 'long', year: 'numeric' })

  // Descarga un .xlsx con todo el historial (préstamos, registros, usuarios
  // y libros). Es la red de seguridad ante la caída o el fin del hosting.
  const handleRespaldo = async () => {
    setDescargando(true)
    try {
      const r = await descargarRespaldoExcel()
      message.success(`Respaldo descargado: ${r.prestamos} préstamos, ${r.registros} registros, ${r.usuarios} usuarios, ${r.libros} libros`)
    } catch {
      message.error('No se pudo generar el respaldo — revisa la conexión e inténtalo de nuevo')
    } finally {
      setDescargando(false)
    }
  }

  // Imprime la hoja con datos. Con alcance "mes" usa lo ya cargado en
  // pantalla; con "todo" pide el historial completo al backend.
  const handleImprimirDatos = async (hoja: 'uso' | 'prestamos') => {
    setImprimiendo(true)
    try {
      if (alcanceHoja === 'mes') {
        const periodo = `Período: ${mesNombre}`
        if (hoja === 'uso') imprimirRegistrosUso(registros, tipoHoja, periodo)
        else imprimirPrestamos(prestamosDelMes, tipoHoja, periodo)
      } else {
        const periodo = 'Historial completo'
        if (hoja === 'uso') {
          const todos = await exportarTodosRegistros()
          imprimirRegistrosUso(todos, tipoHoja, periodo)
        } else {
          const todos = await exportarTodosPrestamos()
          imprimirPrestamos(todos, tipoHoja, periodo)
        }
      }
    } catch {
      message.error('No se pudo generar la hoja — revisa la conexión e inténtalo de nuevo')
    } finally {
      setImprimiendo(false)
    }
  }

  // Reporte de gestión: resumen con indicadores, distribución por carrera
  // y ranking de libros. Pensado para presentar a la institución.
  const handleImprimirReporte = async () => {
    setImprimiendo(true)
    try {
      const esMes = alcanceReporte === 'mes'

      // Registros del período: el mes ya está cargado; para "todo" se pide al backend
      const regs = esMes ? registros : await exportarTodosRegistros()
      const pres = esMes ? prestamosDelMes : await exportarTodosPrestamos()

      const porCarreraMap: Record<string, number> = {}
      regs.forEach((r: any) => {
        if (r.carrera) porCarreraMap[r.carrera] = (porCarreraMap[r.carrera] || 0) + 1
      })
      const porCarrera = Object.entries(porCarreraMap)
        .map(([carrera, visitas]) => ({ carrera, visitas }))
        .sort((a, b) => b.visitas - a.visitas)

      const porTipo = ['DOCENTE', 'ESTUDIANTE', 'INVITADO'].map(tipoPersona => {
        const delTipo = regs.filter((r: any) => r.usuario?.tipoPersona === tipoPersona)
        return {
          tipoPersona,
          visitas: delTipo.length,
          prestamos: delTipo.filter((r: any) => r.tipo === 'prestamo').length,
          devoluciones: delTipo.filter((r: any) => r.tipo === 'devolucion').length,
        }
      })

      // Ranking de libros construido desde los préstamos del período
      const conteoLibros: Record<number, { titulo: string; autor: string; codigo: string; prestamos: number }> = {}
      pres.forEach((p: any) => {
        if (!p.libro) return
        if (!conteoLibros[p.libro.id]) {
          conteoLibros[p.libro.id] = {
            titulo: p.libro.titulo, autor: p.libro.autor,
            codigo: p.libro.codigo, prestamos: 0,
          }
        }
        conteoLibros[p.libro.id].prestamos++
      })
      const librosTop = Object.values(conteoLibros)
        .sort((a, b) => b.prestamos - a.prestamos)
        .slice(0, 15)

      imprimirReporteGestion({
        periodo: esMes ? `Período: ${mesNombre}` : 'Historial completo',
        totalVisitas: regs.length,
        usos: regs.filter((r: any) => r.tipo === 'uso').length,
        prestamos: regs.filter((r: any) => r.tipo === 'prestamo').length,
        devoluciones: regs.filter((r: any) => r.tipo === 'devolucion').length,
        activos: pres.filter((p: any) => p.activo).length,
        porCarrera,
        porTipo,
        librosTop,
        totalLibros,
        disponibles,
      })
    } catch {
      message.error('No se pudo generar el reporte — revisa la conexión e inténtalo de nuevo')
    } finally {
      setImprimiendo(false)
    }
  }

  const cargarDatos = () => {
    setLoading(true)
    Promise.all([
      getLibros(),
      getRegistrosMes(anio, mes),
      getTodosLosPrestamos(),
      getUsuarios(),
    ]).then(([libros, regs, pres, usrs]) => {
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
      setDisponibles(libros.reduce((a: number, b: any) => a + b.disponibles, 0))
      setRegistros(regs)
      setPrestamos(pres)
      // El filtro se construye desde la tabla de usuarios (no desde los préstamos):
      // cada persona aparece una sola vez, ordenada alfabéticamente.
      setUsuarios(
        usrs
          .filter((u: any) => u.rol === 'usuario')
          .sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''))
      )
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [anio, mes])

  useEffect(() => escucharDatosActualizados(cargarDatos), [anio, mes])

  useEffect(() => {
    getStatsPeriodo(periodoResumen, tipoUsuarioResumen, carreraResumen, materiaResumen).then(setStats)
  }, [periodoResumen, tipoUsuarioResumen, carreraResumen, materiaResumen])

  useEffect(() => {
    getMateriasDisponibles().then(setMateriasDisponibles)
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  useEffect(() => {
    getComparativaAnual().then(setComparativaAnual)
    getComparativaPorTipo(periodoResumen).then(setComparativaPorTipo)
  }, [periodoResumen])

  useEffect(() => {
    setCargandoAnalitica(true)
    Promise.all([
      getTotalVisitasPublicas(periodoAnalitica),
      getLibrosMasBuscados(periodoAnalitica),
      getCarrerasMasClickeadas(periodoAnalitica),
      getRankingVisitasUsuarios(periodoAnalitica, tipoUsuarioAnalitica, carreraAnalitica, materiaAnalitica),
      getRankingPrestamosLibros(periodoAnalitica),
      getRankingPrestamosUsuarios(periodoAnalitica, tipoUsuarioAnalitica),
    ]).then(([visitas, buscados, carreras, visitasUsuarios, librosPrestados, prestamosUsuarios]) => {
      setVisitasPublicas(visitas)
      setLibrosMasBuscados(buscados)
      setRankingCarreras(carreras)
      setRankingVisitas(visitasUsuarios)
      setRankingLibros(librosPrestados)
      setRankingPrestamosUsuarios(prestamosUsuarios)
    }).finally(() => setCargandoAnalitica(false))
  }, [periodoAnalitica, tipoUsuarioAnalitica, carreraAnalitica, materiaAnalitica])

  const maxCarrera = stats?.porCarrera?.length > 0
    ? Math.max(...stats.porCarrera.map((c: any) => c.visitas))
    : 1

  // ¿La fecha cae dentro del mes seleccionado en el filtro?
  const enMesSeleccionado = (f: string) => {
    if (!f) return false
    const d = new Date(f)
    return d.getFullYear() === anio && d.getMonth() + 1 === mes
  }

  const registrosFiltrados = registros.filter(r =>
    !usuarioFiltro || r.usuario?.id === usuarioFiltro
  )

  // Préstamos del mes seleccionado, sin los filtros de pantalla — es la
  // base de la hoja impresa cuando el alcance es "mes".
  const prestamosDelMes = prestamos.filter(p => enMesSeleccionado(p.fechaPrestamo))

  const prestamosFiltrados = prestamos.filter(p => {
    // Antes el selector de Mes no afectaba a los préstamos (mostraba todo el
    // historial aunque el encabezado dijera "junio 2026"). Ahora sí se respeta.
    const porMes = enMesSeleccionado(p.fechaPrestamo)
    const porUsuario = !usuarioFiltro || p.usuario?.id === usuarioFiltro
    const porEstado = !soloActivos || p.activo
    return porMes && porUsuario && porEstado
  })

  const columnasRegistros = [
    {
      title: 'Fecha y hora', dataIndex: 'fecha', key: 'fecha',
      render: (f: string) => {
        const d = new Date(f)
        return `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`
      },
      sorter: (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      defaultSortOrder: 'ascend' as any,
    },
    { title: 'Persona', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u?.nombre || '—' },
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: (t: string) => {
        const col: Record<string, string> = { uso: 'cyan', prestamo: 'blue', devolucion: 'green' }
        const lab: Record<string, string> = { uso: 'Uso sala', prestamo: 'Préstamo', devolucion: 'Devolución' }
        return <Tag color={col[t] || 'default'}>{lab[t] || t}</Tag>
      },
    },
    { title: 'Actividad', dataIndex: 'actividad', key: 'actividad', render: (v: string) => v || '—' },
    { title: 'Carrera', dataIndex: 'carrera', key: 'carrera', render: (v: string) => v || '—' },
    { title: 'Ciclo', dataIndex: 'ciclo', key: 'ciclo', render: (v: number) => v ? `${v}° Ciclo` : '—' },
    { title: 'Jornada', dataIndex: 'jornada', key: 'jornada', render: (v: string) => v || '—' },
    { title: 'Materia', dataIndex: 'materia', key: 'materia', render: (v: string) => v || '—' },
  ]

  const columnasPrestamos = [
    {
      title: 'Fecha préstamo', dataIndex: 'fechaPrestamo', key: 'fechaPrestamo',
      render: (f: string) => new Date(f).toLocaleDateString('es-EC'),
      sorter: (a: any, b: any) => new Date(b.fechaPrestamo).getTime() - new Date(a.fechaPrestamo).getTime(),
      defaultSortOrder: 'ascend' as any,
    },
    {
      title: 'Usuario', dataIndex: 'usuario', key: 'usuario',
      render: (u: any) => u
        ? (
          <div>
            <div>{u.nombre}</div>
            {u.tipoPersona && (
              <div style={{ fontSize: 11, color: TEXTO_TENUE }}>{ETIQUETA_TIPO[u.tipoPersona] || u.tipoPersona}</div>
            )}
          </div>
        )
        : '—',
    },
    {
      title: 'Libro', dataIndex: 'libro', key: 'libro',
      render: (l: any) => (
        <div>
          <div style={{ fontWeight: 600, color: TEXTO }}>{l?.titulo}</div>
          <div style={{ fontSize: 12, color: TEXTO_SUAVE }}>{l?.autor}</div>
        </div>
      ),
    },
    { title: 'Código', dataIndex: 'libro', key: 'codigo', render: (l: any) => <Tag>{l?.codigo}</Tag> },
    {
      title: 'Devolución esperada', dataIndex: 'fechaDevolucionEsperada', key: 'fechaDevolucionEsperada',
      render: (f: string, row: any) => {
        if (!row.activo) return <span style={{ color: TEXTO_TENUE }}>—</span>
        if (!f) return <span style={{ color: TEXTO_TENUE }}>No definida</span>
        const dias = Math.ceil((new Date(f).getTime() - Date.now()) / 86400000)
        return (
          <div>
            <div>{new Date(f).toLocaleDateString('es-EC')}</div>
            <div style={{ fontSize: 11, color: dias < 0 ? '#DC2626' : dias <= 3 ? '#D97706' : '#15803D', fontWeight: 600 }}>
              {dias < 0 ? `⚠️ ${Math.abs(dias)} días vencido` : dias === 0 ? '⚠️ Vence hoy' : `${dias} días restantes`}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Estado', dataIndex: 'activo', key: 'activo',
      render: (activo: boolean, row: any) => activo
        ? <Tag color="orange">Activo</Tag>
        : (
          <div>
            <Tag color="green">Devuelto</Tag>
            {row.fechaDevolucion && (
              <div style={{ fontSize: 11, color: TEXTO_SUAVE, marginTop: 2 }}>
                {new Date(row.fechaDevolucion).toLocaleDateString('es-EC')}
              </div>
            )}
          </div>
        ),
    },
  ]

  const columnasLibrosBuscados = [
    {
      title: 'Libro', dataIndex: 'libro', key: 'libro',
      render: (l: any) => l
        ? (
          <div>
            <div style={{ fontWeight: 600, color: TEXTO }}>{l.titulo}</div>
            <div style={{ fontSize: 12, color: TEXTO_SUAVE }}>{l.autor}</div>
          </div>
        )
        : <span style={{ color: TEXTO_TENUE }}>Libro eliminado</span>,
    },
    {
      title: 'Clics desde el catálogo público', dataIndex: 'clics', key: 'clics', width: 180, align: 'center' as const,
      sorter: (a: any, b: any) => a.clics - b.clics,
      defaultSortOrder: 'descend' as any,
      render: (clics: number) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px' }}>{clics}</Tag>,
    },
  ]

  const columnasRankingLibros = [
    {
      title: 'Libro', dataIndex: 'libro', key: 'libro',
      render: (l: any) => (
        <div>
          <div style={{ fontWeight: 600, color: TEXTO }}>{l.titulo}</div>
          <div style={{ fontSize: 12, color: TEXTO_SUAVE }}>{l.autor}</div>
        </div>
      ),
    },
    { title: 'Código', dataIndex: 'libro', key: 'codigo', width: 130, render: (l: any) => <Tag>{l.codigo}</Tag> },
    {
      title: 'Préstamos totales', dataIndex: 'prestamos', key: 'prestamos', width: 160, align: 'center' as const,
      sorter: (a: any, b: any) => a.prestamos - b.prestamos,
      defaultSortOrder: 'descend' as any,
      render: (prestamos: number) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px' }}>{prestamos}</Tag>,
    },
  ]

  const columnasRankingVisitas = [
    { title: 'Usuario', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u.nombre },
    {
      title: 'Visitas registradas', dataIndex: 'visitas', key: 'visitas', width: 180, align: 'center' as const,
      sorter: (a: any, b: any) => a.visitas - b.visitas,
      defaultSortOrder: 'descend' as any,
      render: (visitas: number) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px' }}>{visitas}</Tag>,
    },
  ]

  const columnasRankingPrestamosUsuarios = [
    { title: 'Usuario', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u.nombre },
    {
      title: 'Préstamos totales', dataIndex: 'prestamos', key: 'prestamos', width: 180, align: 'center' as const,
      sorter: (a: any, b: any) => a.prestamos - b.prestamos,
      defaultSortOrder: 'descend' as any,
      render: (prestamos: number) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px' }}>{prestamos}</Tag>,
    },
  ]

  const columnasRankingCarreras = [
    {
      title: 'Carrera', dataIndex: 'programa', key: 'programa',
      render: (p: string) => nombreCortoPrograma(p),
    },
    {
      title: 'Clics desde el landing público', dataIndex: 'clics', key: 'clics', width: 180, align: 'center' as const,
      sorter: (a: any, b: any) => a.clics - b.clics,
      defaultSortOrder: 'descend' as any,
      render: (clics: number) => <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px' }}>{clics}</Tag>,
    },
  ]

  const filtros = (
    <div style={estiloFiltros}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={etiquetaFiltro}>Mes:</span>
        <DatePicker
          picker="month"
          value={dayjs(`${anio}-${String(mes).padStart(2, '0')}-01`)}
          onChange={(d: Dayjs | null) => {
            if (d) { setAnio(d.year()); setMes(d.month() + 1) }
          }}
          format="MMMM YYYY"
          style={{ width: 160 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={etiquetaFiltro}>Usuario:</span>
        <Select
          placeholder="Todos los usuarios"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ minWidth: 220 }}
          value={usuarioFiltro}
          onChange={setUsuarioFiltro}
          options={usuarios.map((u: any) => ({
            value: u.id,
            label: u.tipoPersona && u.tipoPersona !== 'DOCENTE'
              ? `${u.nombre} (${ETIQUETA_TIPO[u.tipoPersona] || u.tipoPersona})`
              : u.nombre,
          }))}
        />
      </div>
      {activeTab === 'prestamos' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={etiquetaFiltro}>Estado:</span>
          <Select
            value={soloActivos ? 'activos' : 'todos'}
            onChange={val => setSoloActivos(val === 'activos')}
            style={{ width: 140 }}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'activos', label: 'Solo activos' },
            ]}
          />
        </div>
      )}
    </div>
  )

  // Barra de impresión: se muestra en las pestañas de visitas y préstamos.
  // "Hoja con datos" imprime lo registrado; "Hoja en blanco" imprime el
  // formulario vacío para llenar a mano si el sistema no está disponible.
  const barraImpresion = (hoja: 'uso' | 'prestamos') => (
    <div style={estiloBarra}>
      <PrinterOutlined style={{ color: MARCA, fontSize: 18 }} />
      <span style={etiquetaFiltro}>Imprimir hoja:</span>
      <Select
        value={tipoHoja}
        onChange={setTipoHoja}
        style={{ width: 150 }}
        options={OPCIONES_TIPO_HOJA}
      />
      <Select
        value={alcanceHoja}
        onChange={setAlcanceHoja}
        style={{ width: 180 }}
        options={OPCIONES_ALCANCE}
      />
      <Button
        type="primary"
        icon={<PrinterOutlined />}
        loading={imprimiendo}
        onClick={() => handleImprimirDatos(hoja)}
        style={{ background: MARCA, borderColor: MARCA }}
      >
        Hoja con datos
      </Button>
      <Button
        icon={<FileTextOutlined />}
        onClick={() => hoja === 'uso'
          ? imprimirPlantillaUso(tipoHoja)
          : imprimirPlantillaPrestamos(tipoHoja)}
      >
        Hoja en blanco
      </Button>
      <span style={{ fontSize: 11, color: TEXTO_SUAVE, marginLeft: 'auto' }}>
        Se abre el diálogo de impresión: puedes imprimir o guardar como PDF.
      </span>
    </div>
  )

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <BarChartOutlined style={{ marginRight: 12, color: MARCA }} />
            Reportes
          </h1>
          <p className="reportes-subtitulo">Biblioteca Daniel Perazzo · {mesNombre}</p>
        </div>
        <Button
          className="btn-exportar"
          icon={<DownloadOutlined />}
          size="large"
          loading={descargando}
          onClick={handleRespaldo}
        >
          Descargar respaldo (Excel)
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as TabKey)}
        items={[
          {
            key: 'resumen',
            label: 'Uso de la biblioteca',
            children: (
              <>
                <div style={estiloBarra}>
                  <FilePdfOutlined style={{ color: MARCA, fontSize: 18 }} />
                  <span style={etiquetaFiltro}>Reporte de gestión:</span>
                  <Select
                    value={alcanceReporte}
                    onChange={setAlcanceReporte}
                    style={{ width: 180 }}
                    options={OPCIONES_ALCANCE}
                  />
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    loading={imprimiendo}
                    onClick={handleImprimirReporte}
                    style={{ background: MARCA, borderColor: MARCA }}
                  >
                    Imprimir reporte
                  </Button>
                  <span style={{ fontSize: 11, color: TEXTO_SUAVE, marginLeft: 'auto' }}>
                    Resumen con indicadores, uso por carrera y libros más prestados.
                  </span>
                </div>

                <div style={estiloFiltros}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Período:</span>
                    <Select
                      value={periodoResumen}
                      onChange={setPeriodoResumen}
                      style={{ width: 160 }}
                      options={[
                        { value: 'dia', label: 'Último día' },
                        { value: 'semana', label: 'Última semana' },
                        { value: 'mes', label: 'Último mes' },
                        { value: 'anio', label: 'Último año' },
                        { value: 'todo', label: 'Todo el historial' },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Tipo de usuario:</span>
                    <Select
                      value={tipoUsuarioResumen}
                      onChange={setTipoUsuarioResumen}
                      allowClear
                      placeholder="Todos"
                      style={{ width: 160 }}
                      options={[
                        { value: 'DOCENTE', label: 'Docentes' },
                        { value: 'ESTUDIANTE', label: 'Estudiantes' },
                        { value: 'INVITADO', label: 'Invitados' },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Carrera:</span>
                    <Select
                      value={carreraResumen}
                      onChange={setCarreraResumen}
                      allowClear
                      placeholder="Todas"
                      showSearch
                      optionFilterProp="label"
                      style={{ width: 200 }}
                      options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Materia:</span>
                    <Select
                      value={materiaResumen}
                      onChange={setMateriaResumen}
                      allowClear
                      placeholder="Todas"
                      showSearch
                      optionFilterProp="label"
                      style={{ width: 200 }}
                      options={materiasDisponibles.map(m => ({ value: m, label: m }))}
                    />
                  </div>
                </div>

                <div className="kpi-grid">
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('visitas')}>
                    <TeamOutlined style={{ fontSize: 22, color: MARCA, marginBottom: 8 }} />
                    <Statistic title="Personas que visitaron" value={stats?.totalVisitas ?? 0} />
                    <div style={{ fontSize: 11, color: MARCA, marginTop: 4 }}>Ver detalle →</div>
                  </div>
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => { setSoloActivos(false); setActiveTab('prestamos') }}>
                    <SwapOutlined style={{ fontSize: 22, color: MARCA, marginBottom: 8 }} />
                    <Statistic title="Libros prestados" value={stats?.prestamos ?? 0} />
                    <div style={{ fontSize: 11, color: MARCA, marginTop: 4 }}>Ver detalle →</div>
                  </div>
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => { setSoloActivos(false); setActiveTab('prestamos') }}>
                    <CheckCircleOutlined style={{ fontSize: 22, color: MARCA, marginBottom: 8 }} />
                    <Statistic title="Libros devueltos" value={stats?.devoluciones ?? 0} />
                    <div style={{ fontSize: 11, color: MARCA, marginTop: 4 }}>Ver detalle →</div>
                  </div>
                </div>

                <div className="reportes-grid-inferior">
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">Libros disponibles ahora</h3>
                    <div className="barra-label">
                      <span>{disponibles} de {totalLibros} ejemplares libres</span>
                      <strong>{totalLibros > 0 ? Math.round((disponibles / totalLibros) * 100) : 0}%</strong>
                    </div>
                    <Progress
                      percent={totalLibros > 0 ? Math.round((disponibles / totalLibros) * 100) : 0}
                      strokeColor={{ '0%': MARCA_OSCURO, '100%': MARCA }}
                      trailColor={MARCA_FONDO} strokeWidth={12} strokeLinecap="round" showInfo={false}
                    />
                  </div>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <BookOutlined style={{ marginRight: 8 }} />
                      ¿Quiénes usan más la biblioteca?
                    </h3>
                    {stats?.porCarrera?.length > 0 ? (
                      <div className="carreras-lista">
                        {stats.porCarrera.map((c: any) => (
                          <div key={c.carrera} className="carrera-bar-item">
                            <div className="carrera-bar-label">
                              <span>{c.carrera}</span>
                              <strong>{c.visitas} visitas</strong>
                            </div>
                            <Progress
                              percent={Math.round((c.visitas / maxCarrera) * 100)}
                              strokeColor={{ '0%': MARCA_OSCURO, '100%': MARCA }}
                              trailColor={MARCA_FONDO} strokeWidth={10} strokeLinecap="round" showInfo={false}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: TEXTO_TENUE, marginTop: 16 }}>Sin registros en este período.</p>
                    )}
                  </div>
                </div>

                {stats?.porCarrera?.length > 0 && (
                  <div className="reportes-grid-inferior" style={{ marginTop: 22 }}>
                    <div className="reporte-card" style={{ gridColumn: '1 / -1' }}>
                      <h3 className="reporte-card-titulo">Distribución de visitas por carrera</h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={stats.porCarrera}
                            dataKey="visitas"
                            nameKey="carrera"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            label={(d: any) => `${d.visitas}`}
                          >
                            {stats.porCarrera.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />
                            ))}
                          </Pie>
                          <RTooltip />
                          <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {comparativaPorTipo.length > 0 && (
                  <div className="reportes-grid-inferior" style={{ marginTop: 22 }}>
                    <div className="reporte-card" style={{ gridColumn: '1 / -1' }}>
                      <h3 className="reporte-card-titulo">Comparativa entre Docentes, Estudiantes e Invitados</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativaPorTipo.map((t: any) => ({
                          ...t,
                          etiqueta: t.tipoPersona === 'DOCENTE' ? 'Docentes' : t.tipoPersona === 'ESTUDIANTE' ? 'Estudiantes' : 'Invitados',
                        }))} barGap={6}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="etiqueta" tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Legend />
                          <Bar dataKey="visitas" name="Visitas" fill={MARCA_OSCURO} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="prestamos" name="Préstamos" fill={MARCA} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="devoluciones" name="Devoluciones" fill={MARCA_CLARO} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {comparativaAnual.length > 0 && (
                  <div className="reportes-grid-inferior" style={{ marginTop: 22 }}>
                    <div className="reporte-card" style={{ gridColumn: '1 / -1' }}>
                      <h3 className="reporte-card-titulo">Comparativa entre años</h3>
                      {comparativaAnual.length === 1 && (
                        <p style={{ color: TEXTO_TENUE, fontSize: 13, marginBottom: 8 }}>
                          Todavía hay datos de un solo año — este gráfico se vuelve más útil a medida que se acumula historial de años siguientes.
                        </p>
                      )}
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativaAnual.map((a: any) => ({ ...a, anio: String(a.anio) }))} barGap={6}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="anio" tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Legend />
                          <Bar dataKey="usos" name="Uso de sala" fill={MARCA_OSCURO} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="prestamos" name="Préstamos" fill={MARCA} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="devoluciones" name="Devoluciones" fill={MARCA_CLARO} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            ),
          },
          {
            key: 'visitas',
            label: `Registro de visitas (${registrosFiltrados.length})`,
            children: (
              <>
                {filtros}
                {barraImpresion('uso')}
                <div className="reporte-card">
                  <Table
                    columns={columnasRegistros}
                    dataSource={registrosFiltrados}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: t => `${t} registros` }}
                    scroll={{ x: true }}
                    size="small"
                  />
                </div>
              </>
            ),
          },
          {
            key: 'prestamos',
            label: `Préstamos (${prestamosFiltrados.length})`,
            children: (
              <>
                {filtros}
                {barraImpresion('prestamos')}
                <div className="reporte-card">
                  <Table
                    columns={columnasPrestamos}
                    dataSource={prestamosFiltrados}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: t => `${t} préstamos` }}
                    scroll={{ x: true }}
                    size="small"
                  />
                </div>
              </>
            ),
          },
          {
            key: 'analitica',
            label: 'Catálogo web y rankings',
            children: (
              <>
                <div style={estiloFiltros}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Periodo:</span>
                    <Select
                      value={periodoAnalitica}
                      onChange={setPeriodoAnalitica}
                      style={{ width: 160 }}
                      options={[
                        { value: 'dia', label: 'Último día' },
                        { value: 'semana', label: 'Última semana' },
                        { value: 'mes', label: 'Último mes' },
                        { value: 'anio', label: 'Último año' },
                        { value: 'todo', label: 'Todo el historial' },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Tipo de usuario:</span>
                    <Select
                      value={tipoUsuarioAnalitica}
                      onChange={setTipoUsuarioAnalitica}
                      allowClear
                      placeholder="Todos"
                      style={{ width: 160 }}
                      options={[
                        { value: 'DOCENTE', label: 'Docentes' },
                        { value: 'ESTUDIANTE', label: 'Estudiantes' },
                        { value: 'INVITADO', label: 'Invitados' },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Carrera:</span>
                    <Select
                      value={carreraAnalitica}
                      onChange={setCarreraAnalitica}
                      allowClear
                      placeholder="Todas"
                      showSearch
                      optionFilterProp="label"
                      style={{ width: 200 }}
                      options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={etiquetaFiltro}>Materia:</span>
                    <Select
                      value={materiaAnalitica}
                      onChange={setMateriaAnalitica}
                      allowClear
                      placeholder="Todas"
                      showSearch
                      optionFilterProp="label"
                      style={{ width: 200 }}
                      options={materiasDisponibles.map(m => ({ value: m, label: m }))}
                    />
                  </div>
                </div>

                <div className="kpi-grid">
                  <div className="kpi-card">
                    <TeamOutlined style={{ fontSize: 22, color: MARCA, marginBottom: 8 }} />
                    <Statistic title="Visitas al catálogo público" value={visitasPublicas} />
                  </div>
                </div>

                <div className="reportes-grid-inferior">
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <TeamOutlined style={{ marginRight: 8, color: MARCA }} />
                      Carreras con más interés (clics en el landing)
                    </h3>
                    {rankingCarreras.length > 0 && (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...rankingCarreras].sort((a: any, b: any) => b.clics - a.clics).slice(0, 5).map((r: any) => ({ nombre: nombreCortoPrograma(r.programa), clics: r.clics }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: TEXTO_SUAVE }} interval={0} angle={-25} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Bar dataKey="clics" fill={MARCA} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table
                      columns={columnasRankingCarreras}
                      dataSource={rankingCarreras}
                      rowKey={(r: any) => r.programa}
                      loading={cargandoAnalitica}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <BookOutlined style={{ marginRight: 8, color: MARCA }} />
                      Libros más buscados en el catálogo público
                    </h3>
                    {librosMasBuscados.length > 0 && (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...librosMasBuscados].sort((a: any, b: any) => b.clics - a.clics).slice(0, 5).map((r: any) => ({ nombre: r.libro ? (r.libro.titulo.length > 20 ? r.libro.titulo.slice(0, 20) + '…' : r.libro.titulo) : 'Eliminado', clics: r.clics }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: TEXTO_SUAVE }} interval={0} angle={-25} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Bar dataKey="clics" fill={MARCA_OSCURO} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table
                      columns={columnasLibrosBuscados}
                      dataSource={librosMasBuscados}
                      rowKey={(r: any) => r.libro?.id ?? Math.random()}
                      loading={cargandoAnalitica}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>
                </div>

                <div className="reportes-grid-inferior" style={{ marginTop: 22 }}>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <SwapOutlined style={{ marginRight: 8, color: MARCA }} />
                      Libros por número de préstamos
                    </h3>
                    {rankingLibros.length > 0 && (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...rankingLibros].sort((a: any, b: any) => b.prestamos - a.prestamos).slice(0, 5).map((r: any) => ({ nombre: r.libro.titulo.length > 20 ? r.libro.titulo.slice(0, 20) + '…' : r.libro.titulo, prestamos: r.prestamos }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: TEXTO_SUAVE }} interval={0} angle={-25} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Bar dataKey="prestamos" fill={MARCA} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table
                      columns={columnasRankingLibros}
                      dataSource={rankingLibros}
                      rowKey={(r: any) => r.libro.id}
                      loading={cargandoAnalitica}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <TeamOutlined style={{ marginRight: 8, color: MARCA }} />
                      Usuarios por número de visitas
                    </h3>
                    {rankingVisitas.length > 0 && (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...rankingVisitas].sort((a: any, b: any) => b.visitas - a.visitas).slice(0, 5).map((r: any) => ({ nombre: r.usuario.nombre, visitas: r.visitas }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: TEXTO_SUAVE }} interval={0} angle={-25} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Bar dataKey="visitas" fill={MARCA_MEDIO} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table
                      columns={columnasRankingVisitas}
                      dataSource={rankingVisitas}
                      rowKey={(r: any) => r.usuario.id}
                      loading={cargandoAnalitica}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>
                </div>

                <div className="reportes-grid-inferior" style={{ marginTop: 22 }}>
                  <div className="reporte-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="reporte-card-titulo">
                      <TeamOutlined style={{ marginRight: 8, color: MARCA }} />
                      Usuarios por número de préstamos
                    </h3>
                    {rankingPrestamosUsuarios.length > 0 && (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...rankingPrestamosUsuarios].sort((a: any, b: any) => b.prestamos - a.prestamos).slice(0, 5).map((r: any) => ({ nombre: r.usuario.nombre, prestamos: r.prestamos }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0F1" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: TEXTO_SUAVE }} interval={0} angle={-25} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} />
                          <RTooltip />
                          <Bar dataKey="prestamos" fill={MARCA_MEDIO} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <Table
                      columns={columnasRankingPrestamosUsuarios}
                      dataSource={rankingPrestamosUsuarios}
                      rowKey={(r: any) => r.usuario.id}
                      loading={cargandoAnalitica}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>
                </div>
                <p style={{ color: TEXTO_TENUE, fontSize: 12, marginTop: 14 }}>
                  Haz clic en el encabezado de cualquier columna numérica para ordenar de menor a mayor y ver quién/qué tiene menos actividad.
                </p>
              </>
            ),
          },
        ]}
      />
    </div>
  )
}

export default Reportes