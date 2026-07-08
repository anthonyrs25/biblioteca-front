import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Statistic, Progress, Tabs, Table, Tag, Select, DatePicker } from 'antd'
import {
  ArrowLeftOutlined, BarChartOutlined, TeamOutlined,
  SwapOutlined, CheckCircleOutlined, BookOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { getStatsRegistros, getLibros, getRegistrosMes, getTodosLosPrestamos, getDocentes, getTotalVisitasPublicas, getLibrosMasBuscados, getCarrerasMasClickeadas, getRankingVisitasUsuarios, getRankingPrestamosLibros, getRankingPrestamosUsuarios } from '../../api/biblioteca'

type TabKey = 'resumen' | 'visitas' | 'prestamos' | 'analitica'

const nombreCorto: Record<string, string> = {
  'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE': 'Desarrollo de Software',
  'TECNOLOGÍA SUPERIOR EN MARKETING': 'Marketing Digital y Negocios',
  'TECNOLOGÍA SUPERIOR EN GASTRONOMÍA': 'Gastronomía',
  'DISEÑO GRÁFICO CON NIVEL EQUIVALENTE A TECNOLOGÍA SUPERIOR': 'Diseño Gráfico',
  'TECNOLOGÍA SUPERIOR EN TURISMO': 'Turismo',
  'ENFERMERÍA': 'Enfermería',
  'CONTABILIDAD Y ASESORIA TRIBUTARIA': 'Contabilidad y Asesoría Tributaria',
  'REDES Y TELECOMUNICACIONES': 'Redes y Telecomunicaciones',
  'ELECTRICIDAD': 'Electricidad',
  'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN DEL TALENTO HUMANO': 'Talento Humano',
}

function Reportes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'resumen'
  )
  const [stats, setStats] = useState<any>(null)
  const [totalLibros, setTotalLibros] = useState(0)
  const [disponibles, setDisponibles] = useState(0)
  const [registros, setRegistros] = useState<any[]>([])
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [docentes, setDocentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(dayjs().year())
  const [mes, setMes] = useState(dayjs().month() + 1)
  const [docenteFiltro, setDocenteFiltro] = useState<number | undefined>()
  const [soloActivos, setSoloActivos] = useState(false)
  const [visitasPublicas, setVisitasPublicas] = useState(0)
  const [librosMasBuscados, setLibrosMasBuscados] = useState<any[]>([])
  const [rankingVisitas, setRankingVisitas] = useState<any[]>([])
  const [rankingLibros, setRankingLibros] = useState<any[]>([])
  const [rankingPrestamosUsuarios, setRankingPrestamosUsuarios] = useState<any[]>([])
  const [rankingCarreras, setRankingCarreras] = useState<any[]>([])
  const [cargandoAnalitica, setCargandoAnalitica] = useState(true)
  const [periodoAnalitica, setPeriodoAnalitica] = useState<string>('todo')

  const mesNombre = dayjs(`${anio}-${String(mes).padStart(2, '0')}-01`)
    .toDate().toLocaleString('es-EC', { month: 'long', year: 'numeric' })

  const cargarDatos = () => {
    setLoading(true)
    Promise.all([
      getStatsRegistros(anio, mes),
      getLibros(),
      getRegistrosMes(anio, mes),
      getTodosLosPrestamos(),
      getDocentes(),
    ]).then(([s, libros, regs, pres, docs]) => {
      setStats(s)
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
      setDisponibles(libros.reduce((a: number, b: any) => a + b.disponibles, 0))
      setRegistros(regs)
      setPrestamos(pres)
      setDocentes(docs.filter((d: any) => d.rol === 'usuario'))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [anio, mes])

  useEffect(() => {
    setCargandoAnalitica(true)
    Promise.all([
      getTotalVisitasPublicas(periodoAnalitica),
      getLibrosMasBuscados(periodoAnalitica),
      getCarrerasMasClickeadas(periodoAnalitica),
      getRankingVisitasUsuarios(periodoAnalitica),
      getRankingPrestamosLibros(periodoAnalitica),
      getRankingPrestamosUsuarios(periodoAnalitica),
    ]).then(([visitas, buscados, carreras, visitasUsuarios, librosPrestados, prestamosUsuarios]) => {
      setVisitasPublicas(visitas)
      setLibrosMasBuscados(buscados)
      setRankingCarreras(carreras)
      setRankingVisitas(visitasUsuarios)
      setRankingLibros(librosPrestados)
      setRankingPrestamosUsuarios(prestamosUsuarios)
    }).finally(() => setCargandoAnalitica(false))
  }, [periodoAnalitica])

  const maxCarrera = stats?.porCarrera?.length > 0
    ? Math.max(...stats.porCarrera.map((c: any) => c.visitas))
    : 1

  const registrosFiltrados = registros.filter(r =>
    !docenteFiltro || r.usuario?.id === docenteFiltro
  )

  const prestamosFiltrados = prestamos.filter(p => {
    const porDocente = !docenteFiltro || p.usuario?.id === docenteFiltro
    const porEstado = !soloActivos || p.activo
    return porDocente && porEstado
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
    { title: 'Docente', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u?.nombre || '—' },
    {
      title: 'Libro', dataIndex: 'libro', key: 'libro',
      render: (l: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1A2332' }}>{l?.titulo}</div>
          <div style={{ fontSize: 12, color: '#4A5568' }}>{l?.autor}</div>
        </div>
      ),
    },
    { title: 'Código', dataIndex: 'libro', key: 'codigo', render: (l: any) => <Tag>{l?.codigo}</Tag> },
    {
      title: 'Devolución esperada', dataIndex: 'fechaDevolucionEsperada', key: 'fechaDevolucionEsperada',
      render: (f: string, row: any) => {
        if (!row.activo) return <span style={{ color: '#94A3B8' }}>—</span>
        if (!f) return <span style={{ color: '#94A3B8' }}>No definida</span>
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
              <div style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>
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
            <div style={{ fontWeight: 600, color: '#1A2332' }}>{l.titulo}</div>
            <div style={{ fontSize: 12, color: '#4A5568' }}>{l.autor}</div>
          </div>
        )
        : <span style={{ color: '#94A3B8' }}>Libro eliminado</span>,
    },
    {
      title: 'Clics desde el catálogo público', dataIndex: 'clics', key: 'clics',
      sorter: (a: any, b: any) => a.clics - b.clics,
      defaultSortOrder: 'descend' as any,
    },
  ]

  const columnasRankingLibros = [
    {
      title: 'Libro', dataIndex: 'libro', key: 'libro',
      render: (l: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1A2332' }}>{l.titulo}</div>
          <div style={{ fontSize: 12, color: '#4A5568' }}>{l.autor}</div>
        </div>
      ),
    },
    { title: 'Código', dataIndex: 'libro', key: 'codigo', render: (l: any) => <Tag>{l.codigo}</Tag> },
    {
      title: 'Préstamos totales', dataIndex: 'prestamos', key: 'prestamos',
      sorter: (a: any, b: any) => a.prestamos - b.prestamos,
      defaultSortOrder: 'descend' as any,
    },
  ]

  const columnasRankingVisitas = [
    { title: 'Docente', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u.nombre },
    {
      title: 'Visitas registradas', dataIndex: 'visitas', key: 'visitas',
      sorter: (a: any, b: any) => a.visitas - b.visitas,
      defaultSortOrder: 'descend' as any,
    },
  ]

  const columnasRankingPrestamosUsuarios = [
    { title: 'Docente', dataIndex: 'usuario', key: 'usuario', render: (u: any) => u.nombre },
    {
      title: 'Préstamos totales', dataIndex: 'prestamos', key: 'prestamos',
      sorter: (a: any, b: any) => a.prestamos - b.prestamos,
      defaultSortOrder: 'descend' as any,
    },
  ]

  const columnasRankingCarreras = [
    {
      title: 'Carrera', dataIndex: 'programa', key: 'programa',
      render: (p: string) => nombreCorto[p] || p,
    },
    {
      title: 'Clics desde el landing público', dataIndex: 'clics', key: 'clics',
      sorter: (a: any, b: any) => a.clics - b.clics,
      defaultSortOrder: 'descend' as any,
    },
  ]

  const filtros = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: '#F5F7FA', borderRadius: 10, border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>Mes:</span>
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
        <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>Docente:</span>
        <Select
          placeholder="Todos los docentes"
          allowClear
          style={{ minWidth: 220 }}
          value={docenteFiltro}
          onChange={setDocenteFiltro}
          options={docentes.map((d: any) => ({ value: d.id, label: d.nombre }))}
        />
      </div>
      {activeTab === 'prestamos' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>Estado:</span>
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

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <BarChartOutlined style={{ marginRight: 12, color: '#00796B' }} />
            Reportes
          </h1>
          <p className="reportes-subtitulo">Biblioteca Daniel Perazzo · {mesNombre}</p>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as TabKey)}
        items={[
          {
            key: 'resumen',
            label: 'Resumen del mes',
            children: (
              <>
                {filtros}
                <div className="kpi-grid">
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('visitas')}>
                    <TeamOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Personas que visitaron" value={stats?.totalVisitas ?? 0} />
                    <div style={{ fontSize: 11, color: '#00796B', marginTop: 4 }}>Ver detalle →</div>
                  </div>
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => { setSoloActivos(false); setActiveTab('prestamos') }}>
                    <SwapOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Libros prestados" value={stats?.prestamos ?? 0} />
                    <div style={{ fontSize: 11, color: '#00796B', marginTop: 4 }}>Ver detalle →</div>
                  </div>
                  <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => { setSoloActivos(false); setActiveTab('prestamos') }}>
                    <CheckCircleOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Libros devueltos" value={stats?.devoluciones ?? 0} />
                    <div style={{ fontSize: 11, color: '#00796B', marginTop: 4 }}>Ver detalle →</div>
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
                      strokeColor={{ '0%': '#00695C', '100%': '#00897B' }}
                      trailColor="#E8F5F3" strokeWidth={12} strokeLinecap="round" showInfo={false}
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
                              strokeColor={{ '0%': '#00695C', '100%': '#00897B' }}
                              trailColor="#E8F5F3" strokeWidth={10} strokeLinecap="round" showInfo={false}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#94A3B8', marginTop: 16 }}>Sin registros este mes.</p>
                    )}
                  </div>
                </div>
              </>
            ),
          },
          {
            key: 'visitas',
            label: `Registro de visitas (${registrosFiltrados.length})`,
            children: (
              <>
                {filtros}
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
            label: 'Analítica',
            children: (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>Periodo:</span>
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

                <div className="kpi-grid">
                  <div className="kpi-card">
                    <TeamOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Visitas al catálogo público" value={visitasPublicas} />
                  </div>
                </div>

                <div className="reportes-grid-inferior">
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Carreras con más interés (clics en el landing)
                    </h3>
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
                      <BookOutlined style={{ marginRight: 8 }} />
                      Libros más buscados en el catálogo público
                    </h3>
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

                <div className="reportes-grid-inferior" style={{ marginTop: 20 }}>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <SwapOutlined style={{ marginRight: 8 }} />
                      Libros por número de préstamos
                    </h3>
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
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Docentes por número de visitas
                    </h3>
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

                <div className="reportes-grid-inferior" style={{ marginTop: 20 }}>
                  <div className="reporte-card">
                    <h3 className="reporte-card-titulo">
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Docentes por número de préstamos
                    </h3>
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
                <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 12 }}>
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