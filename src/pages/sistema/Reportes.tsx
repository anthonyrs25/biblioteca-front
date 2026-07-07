import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Statistic, Progress, Tabs, Table, Tag } from 'antd'
import {
  ArrowLeftOutlined, BarChartOutlined, TeamOutlined,
  SwapOutlined, CheckCircleOutlined, BookOutlined,
} from '@ant-design/icons'
import { getStatsRegistros, getLibros, getRegistrosMes, getPrestamosActivos } from '../../api/biblioteca'

function Reportes() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [totalLibros, setTotalLibros] = useState(0)
  const [disponibles, setDisponibles] = useState(0)
  const [registros, setRegistros] = useState<any[]>([])
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1
  const mesNombre = ahora.toLocaleString('es-EC', { month: 'long', year: 'numeric' })

  useEffect(() => {
    Promise.all([
      getStatsRegistros(anio, mes),
      getLibros(),
      getRegistrosMes(anio, mes),
      getPrestamosActivos(),
    ]).then(([s, libros, regs, pres]) => {
      setStats(s)
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
      setDisponibles(libros.reduce((a: number, b: any) => a + b.disponibles, 0))
      setRegistros(regs)
      setPrestamos(pres)
    }).finally(() => setLoading(false))
  }, [])

  const maxCarrera = stats?.porCarrera?.length > 0
    ? Math.max(...stats.porCarrera.map((c: any) => c.visitas))
    : 1

  const columnasRegistros = [
    {
      title: 'Fecha y hora',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (f: string) => {
        const d = new Date(f)
        return <span>{d.toLocaleDateString('es-EC')} {d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
      },
      sorter: (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      defaultSortOrder: 'ascend' as any,
    },
    {
      title: 'Persona',
      dataIndex: 'usuario',
      key: 'usuario',
      render: (u: any) => u?.nombre || '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (t: string) => {
        const colores: Record<string, string> = { uso: 'cyan', prestamo: 'blue', devolucion: 'green' }
        const etiquetas: Record<string, string> = { uso: 'Uso sala', prestamo: 'Préstamo', devolucion: 'Devolución' }
        return <Tag color={colores[t] || 'default'}>{etiquetas[t] || t}</Tag>
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
      title: 'Fecha préstamo',
      dataIndex: 'fechaPrestamo',
      key: 'fechaPrestamo',
      render: (f: string) => new Date(f).toLocaleDateString('es-EC'),
      sorter: (a: any, b: any) => new Date(b.fechaPrestamo).getTime() - new Date(a.fechaPrestamo).getTime(),
    },
    {
      title: 'Docente',
      dataIndex: 'usuario',
      key: 'usuario',
      render: (u: any) => u?.nombre || '—',
    },
    {
      title: 'Libro',
      dataIndex: 'libro',
      key: 'libro',
      render: (l: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1A2332' }}>{l?.titulo}</div>
          <div style={{ fontSize: 12, color: '#4A5568' }}>{l?.autor}</div>
        </div>
      ),
    },
    {
      title: 'Código libro',
      dataIndex: 'libro',
      key: 'codigo',
      render: (l: any) => <Tag>{l?.codigo}</Tag>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo: boolean, row: any) => {
        if (activo) {
          const diasRestantes = row.fechaDevolucion
            ? Math.ceil((new Date(row.fechaDevolucion).getTime() - Date.now()) / 86400000)
            : null
          return (
            <div>
              <Tag color="orange">Activo</Tag>
              {diasRestantes !== null && (
                <div style={{ fontSize: 11, color: diasRestantes < 0 ? '#DC2626' : '#4A5568', marginTop: 2 }}>
                  {diasRestantes < 0 ? `${Math.abs(diasRestantes)} días vencido` : `${diasRestantes} días restantes`}
                </div>
              )}
            </div>
          )
        }
        return (
          <div>
            <Tag color="green">Devuelto</Tag>
            {row.fechaDevolucion && (
              <div style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>
                {new Date(row.fechaDevolucion).toLocaleDateString('es-EC')}
              </div>
            )}
          </div>
        )
      },
    },
  ]

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
        defaultActiveKey="resumen"
        items={[
          {
            key: 'resumen',
            label: 'Resumen del mes',
            children: (
              <>
                <div className="kpi-grid" style={{ marginTop: 16 }}>
                  <div className="kpi-card">
                    <TeamOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Personas que visitaron" value={stats?.totalVisitas ?? 0} />
                  </div>
                  <div className="kpi-card">
                    <SwapOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Libros prestados" value={stats?.prestamos ?? 0} />
                  </div>
                  <div className="kpi-card">
                    <CheckCircleOutlined style={{ fontSize: 22, color: '#00796B', marginBottom: 8 }} />
                    <Statistic title="Libros devueltos" value={stats?.devoluciones ?? 0} />
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
                      trailColor="#E8F5F3"
                      strokeWidth={12} strokeLinecap="round" showInfo={false}
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
                              trailColor="#E8F5F3"
                              strokeWidth={10} strokeLinecap="round" showInfo={false}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#94A3B8', marginTop: 16 }}>Sin registros este mes todavía.</p>
                    )}
                  </div>
                </div>
              </>
            ),
          },
          {
            key: 'visitas',
            label: `Registro de visitas (${registros.length})`,
            children: (
              <div className="reporte-card" style={{ marginTop: 16 }}>
                <Table
                  columns={columnasRegistros}
                  dataSource={registros}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                  scroll={{ x: true }}
                  size="small"
                />
              </div>
            ),
          },
          {
            key: 'prestamos',
            label: `Préstamos activos (${prestamos.filter((p: any) => p.activo).length})`,
            children: (
              <div className="reporte-card" style={{ marginTop: 16 }}>
                <Table
                  columns={columnasPrestamos}
                  dataSource={prestamos}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                  scroll={{ x: true }}
                  size="small"
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default Reportes