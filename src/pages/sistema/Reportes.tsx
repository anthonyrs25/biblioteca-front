import { useNavigate } from 'react-router-dom'
import { Statistic, Progress, Button, App } from 'antd'
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  DownloadOutlined,
  TeamOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { libros } from '../../data/libros'

// Datos simulados del mes — cuando haya backend real, vienen de la base de datos
const datosMes = {
  mes: 'Mayo 2026',
  totalVisitas: 87,
  prestamosRealizados: 25,
  devolucionesRealizadas: 18,
  promedioVisitasDia: 4,
  semanas: [
    { semana: 'Semana 1', visitas: 18 },
    { semana: 'Semana 2', visitas: 24 },
    { semana: 'Semana 3', visitas: 21 },
    { semana: 'Semana 4', visitas: 24 },
  ],
  carreras: [
    { carrera: 'Desarrollo de Software', visitas: 42 },
    { carrera: 'Administración', visitas: 22 },
    { carrera: 'Diseño Gráfico', visitas: 14 },
    { carrera: 'Enfermería', visitas: 9 },
  ],
}

function Reportes() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const totalLibros = libros.reduce((a, b) => a + b.totalEjemplares, 0)
  const totalDisponibles = libros.reduce((a, b) => a + b.disponibles, 0)

  const handleExportar = () => {
    message.loading('Generando reporte...', 1)
    setTimeout(() => message.success('Reporte generado'), 1000)
  }

  const maxVisitas = Math.max(...datosMes.semanas.map(s => s.visitas))
  const maxCarrera = Math.max(...datosMes.carreras.map(c => c.visitas))

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
            Biblioteca Daniel Perazzo · {datosMes.mes}
          </p>
        </div>
        <Button
          className="btn-exportar"
          icon={<DownloadOutlined />}
          onClick={handleExportar}
          size="large"
        >
          Descargar reporte
        </Button>
      </div>

      {/* KPIs principales */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <TeamOutlined style={{ fontSize: 22, color: '#2dd4bf', marginBottom: 8 }} />
          <Statistic title="Personas que visitaron" value={datosMes.totalVisitas} />
          <p className="kpi-sub">Unas {datosMes.promedioVisitasDia} visitas por día</p>
        </div>
        <div className="kpi-card">
          <SwapOutlined style={{ fontSize: 22, color: '#67e8f9', marginBottom: 8 }} />
          <Statistic title="Libros prestados" value={datosMes.prestamosRealizados} />
          <p className="kpi-sub">Este mes</p>
        </div>
        <div className="kpi-card">
          <CheckCircleOutlined style={{ fontSize: 22, color: '#8b5cf6', marginBottom: 8 }} />
          <Statistic title="Libros devueltos" value={datosMes.devolucionesRealizadas} />
          <p className="kpi-sub">De los prestados este mes</p>
        </div>
      </div>

      {/* Disponibilidad de libros */}
      <div className="reporte-card">
        <h3 className="reporte-card-titulo">Libros disponibles ahora</h3>
        <div className="barra-label">
          <span>{totalDisponibles} de {totalLibros} ejemplares libres</span>
          <strong>{Math.round((totalDisponibles / totalLibros) * 100)}%</strong>
        </div>
        <Progress
          percent={Math.round((totalDisponibles / totalLibros) * 100)}
          strokeColor={{ '0%': '#14b8a6', '100%': '#22d3ee' }}
          trailColor="rgba(255,255,255,0.08)"
          strokeWidth={12}
          strokeLinecap="round"
          showInfo={false}
        />
      </div>

      {/* Visitas por semana */}
      <div className="reporte-card">
        <h3 className="reporte-card-titulo">Visitas por semana</h3>
        <div className="semanas-grid">
          {datosMes.semanas.map(s => (
            <div key={s.semana} className="semana-col">
              <div className="semana-barras">
                <div className="barra-wrap">
                  <div className="barra-vis" style={{ height: `${(s.visitas / maxVisitas) * 120}px` }} />
                </div>
              </div>
              <div className="semana-label">{s.semana}</div>
              <div className="semana-nums">{s.visitas} visitas</div>
            </div>
          ))}
        </div>
      </div>

      {/* Qué carrera usa más la biblioteca */}
      <div className="reporte-card">
        <h3 className="reporte-card-titulo">
          <BookOutlined style={{ marginRight: 8 }} />
          ¿Quiénes usan más la biblioteca?
        </h3>
        {datosMes.carreras.map(c => (
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

    </div>
  )
}

export default Reportes