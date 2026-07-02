import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Statistic, Progress } from 'antd'
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  TeamOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { getStatsRegistros, getLibros } from '../../api/biblioteca'

function Reportes() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [totalLibros, setTotalLibros] = useState(0)
  const [disponibles, setDisponibles] = useState(0)
  const [loading, setLoading] = useState(true)

  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1
  const mesNombre = ahora.toLocaleString('es-EC', { month: 'long', year: 'numeric' })

  useEffect(() => {
    Promise.all([
      getStatsRegistros(anio, mes),
      getLibros(),
    ]).then(([s, libros]) => {
      setStats(s)
      setTotalLibros(libros.reduce((a: number, b: any) => a + b.totalEjemplares, 0))
      setDisponibles(libros.reduce((a: number, b: any) => a + b.disponibles, 0))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, color: '#fff' }}>Cargando...</div>

  const maxCarrera = stats?.porCarrera?.length > 0
    ? Math.max(...stats.porCarrera.map((c: any) => c.visitas))
    : 1

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <BarChartOutlined style={{ marginRight: 12, color: '#2dd4bf' }} />
            Resumen del mes
          </h1>
          <p className="reportes-subtitulo">
            Biblioteca Daniel Perazzo · {mesNombre}
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <TeamOutlined style={{ fontSize: 22, color: '#2dd4bf', marginBottom: 8 }} />
          <Statistic title="Personas que visitaron" value={stats?.totalVisitas ?? 0} />
        </div>
        <div className="kpi-card">
          <SwapOutlined style={{ fontSize: 22, color: '#67e8f9', marginBottom: 8 }} />
          <Statistic title="Libros prestados" value={stats?.prestamos ?? 0} />
        </div>
        <div className="kpi-card">
          <CheckCircleOutlined style={{ fontSize: 22, color: '#8b5cf6', marginBottom: 8 }} />
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
            strokeColor={{ '0%': '#14b8a6', '100%': '#22d3ee' }}
            trailColor="rgba(255,255,255,0.08)"
            strokeWidth={12}
            strokeLinecap="round"
            showInfo={false}
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
                    strokeColor={{ '0%': '#14b8a6', '100%': '#22d3ee' }}
                    trailColor="rgba(255,255,255,0.08)"
                    strokeWidth={10}
                    strokeLinecap="round"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', marginTop: 16 }}>
              Sin registros este mes todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reportes