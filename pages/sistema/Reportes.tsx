import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, Statistic, Progress, Tag, Button, App } from 'antd'
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  BookOutlined,
  DownloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { libros } from '../../data/libros'
import { docentes } from '../../data/docentes'

const datosMes = {
  mes: 'Mayo 2026',
  totalVisitas: 87,
  visitasSala: 62,
  visitasPrestamo: 25,
  prestamosRealizados: 25,
  devolucionesRealizadas: 18,
  diasHabiles: 22,
  promedioVisitasDia: 4,
  semanas: [
    { semana: 'Semana 1', visitas: 18, prestamos: 5 },
    { semana: 'Semana 2', visitas: 24, prestamos: 8 },
    { semana: 'Semana 3', visitas: 21, prestamos: 7 },
    { semana: 'Semana 4', visitas: 24, prestamos: 5 },
  ],
  carreras: [
    { carrera: 'Desarrollo de Software', visitas: 42, prestamos: 15 },
    { carrera: 'Administración', visitas: 22, prestamos: 6 },
    { carrera: 'Diseño Gráfico', visitas: 14, prestamos: 3 },
    { carrera: 'Enfermería', visitas: 9, prestamos: 1 },
  ],
  actividades: [
    { tipo: 'Trabajo académico', count: 31 },
    { tipo: 'Investigación', count: 18 },
    { tipo: 'Lectura en sala', count: 13 },
    { tipo: 'Reunión de trabajo', count: 8 },
    { tipo: 'Otro', count: 5 },
  ],
}

function Reportes() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [tabActiva, setTabActiva] = useState('funcionamiento')

  const totalLibros = libros.reduce((a, b) => a + b.totalEjemplares, 0)
  const totalDisponibles = libros.reduce((a, b) => a + b.disponibles, 0)
  const totalPrestados = totalLibros - totalDisponibles

  const handleExportar = () => {
    message.loading('Generando reporte...', 1)
    setTimeout(() => message.success('Reporte generado — función disponible con backend real'), 1000)
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
            <BarChartOutlined style={{ marginRight: 12, color: '#0094A2' }} />
            Reportes y Estadísticas
          </h1>
          <p className="reportes-subtitulo">
            Indicadores CACES · Biblioteca Daniel Perazzo · {datosMes.mes}
          </p>
        </div>
        <Button className="btn-exportar" icon={<DownloadOutlined />} onClick={handleExportar} size="large">
          Exportar reporte PDF
        </Button>
      </div>

      <Tabs
        activeKey={tabActiva}
        onChange={setTabActiva}
        className="reportes-tabs"
        items={[
          {
            key: 'funcionamiento',
            label: <span><CalendarOutlined style={{ marginRight: 6 }} />Indicador 4.5.1 — Funcionamiento</span>,
            children: <TabFuncionamiento maxVisitas={maxVisitas} maxCarrera={maxCarrera} />,
          },
          {
            key: 'acervo',
            label: <span><BookOutlined style={{ marginRight: 6 }} />Indicador 4.5.2 — Acervo bibliográfico</span>,
            children: <TabAcervo totalLibros={totalLibros} totalDisponibles={totalDisponibles} totalPrestados={totalPrestados} />,
          },
        ]}
      />
    </div>
  )
}

function TabFuncionamiento({ maxVisitas, maxCarrera }: { maxVisitas: number, maxCarrera: number }) {
  const porcentajePrestamos = Math.round((datosMes.prestamosRealizados / datosMes.totalVisitas) * 100)
  const porcentajeDevoluciones = Math.round((datosMes.devolucionesRealizadas / datosMes.prestamosRealizados) * 100)

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <div className="kpi-card">
          <TeamOutlined style={{ fontSize: 22, color: '#0094A2', marginBottom: 8 }} />
          <Statistic title="Total visitas del mes" value={datosMes.totalVisitas} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">Promedio: {datosMes.promedioVisitasDia} por día</p>
        </div>
        <div className="kpi-card">
          <SwapOutlined style={{ fontSize: 22, color: '#5B5FE3', marginBottom: 8 }} />
          <Statistic title="Préstamos realizados" value={datosMes.prestamosRealizados} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">{porcentajePrestamos}% de las visitas</p>
        </div>
        <div className="kpi-card">
          <CheckCircleOutlined style={{ fontSize: 22, color: '#FF6B35', marginBottom: 8 }} />
          <Statistic title="Devoluciones" value={datosMes.devolucionesRealizadas} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">{porcentajeDevoluciones}% retornados</p>
        </div>
        <div className="kpi-card">
          <CalendarOutlined style={{ fontSize: 22, color: '#0094A2', marginBottom: 8 }} />
          <Statistic title="Días hábiles atendidos" value={datosMes.diasHabiles} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">100% de asistencia</p>
        </div>
      </div>

      <div className="reporte-row">
        <div className="reporte-card">
          <h3 className="reporte-card-titulo">Tipo de visita</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="barra-label"><span>Uso de sala</span><strong>{datosMes.visitasSala}</strong></div>
              <Progress percent={Math.round((datosMes.visitasSala / datosMes.totalVisitas) * 100)} strokeColor={{ '0%': '#0094A2', '100%': '#5B5FE3' }} trailColor="rgba(0,0,0,0.06)" strokeWidth={10} strokeLinecap="round" />
            </div>
            <div>
              <div className="barra-label"><span>Préstamo de libro</span><strong>{datosMes.visitasPrestamo}</strong></div>
              <Progress percent={Math.round((datosMes.visitasPrestamo / datosMes.totalVisitas) * 100)} strokeColor={{ '0%': '#FF6B35', '100%': '#E8541A' }} trailColor="rgba(0,0,0,0.06)" strokeWidth={10} strokeLinecap="round" />
            </div>
          </div>
        </div>

        <div className="reporte-card">
          <h3 className="reporte-card-titulo">Actividades registradas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {datosMes.actividades.map(a => (
              <div key={a.tipo} className="actividad-reporte-item">
                <span className="act-nombre">{a.tipo}</span>
                <div className="act-barra"><div className="act-fill" style={{ width: `${(a.count / datosMes.visitasSala) * 100}%` }} /></div>
                <span className="act-count">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="reporte-card full-width">
        <h3 className="reporte-card-titulo">Visitas y préstamos por semana</h3>
        <div className="semanas-grid">
          {datosMes.semanas.map(s => (
            <div key={s.semana} className="semana-col">
              <div className="semana-barras">
                <div className="barra-wrap"><div className="barra-vis" style={{ height: `${(s.visitas / maxVisitas) * 120}px` }} /></div>
                <div className="barra-wrap"><div className="barra-pres" style={{ height: `${(s.prestamos / maxVisitas) * 120}px` }} /></div>
              </div>
              <div className="semana-label">{s.semana}</div>
              <div className="semana-nums">
                <span style={{ color: '#0094A2' }}>{s.visitas} vis.</span>
                <span style={{ color: '#FF6B35' }}>{s.prestamos} pres.</span>
              </div>
            </div>
          ))}
        </div>
        <div className="leyenda">
          <span><span className="leyenda-dot" style={{ background: '#0094A2' }} />Visitas</span>
          <span><span className="leyenda-dot" style={{ background: '#FF6B35' }} />Préstamos</span>
        </div>
      </div>

      <div className="reporte-card full-width">
        <h3 className="reporte-card-titulo">Uso por carrera</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {datosMes.carreras.map(c => (
            <div key={c.carrera}>
              <div className="barra-label"><span>{c.carrera}</span><strong>{c.visitas} visitas · {c.prestamos} préstamos</strong></div>
              <Progress percent={Math.round((c.visitas / maxCarrera) * 100)} strokeColor={{ '0%': '#0094A2', '100%': '#5B5FE3' }} trailColor="rgba(0,0,0,0.06)" strokeWidth={10} strokeLinecap="round" format={() => `${c.visitas}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabAcervo({ totalLibros, totalDisponibles, totalPrestados }: { totalLibros: number, totalDisponibles: number, totalPrestados: number }) {
  const porcentajeDisponible = totalLibros > 0 ? Math.round((totalDisponibles / totalLibros) * 100) : 0

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <div className="kpi-card">
          <BookOutlined style={{ fontSize: 22, color: '#0094A2', marginBottom: 8 }} />
          <Statistic title="Total de títulos" value={libros.length} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">En catálogo activo</p>
        </div>
        <div className="kpi-card">
          <BookOutlined style={{ fontSize: 22, color: '#5B5FE3', marginBottom: 8 }} />
          <Statistic title="Total ejemplares" value={totalLibros} valueStyle={{ color: '#1E2A38', fontWeight: 900 }} />
          <p className="kpi-sub">Físicos en biblioteca</p>
        </div>
        <div className="kpi-card">
          <CheckCircleOutlined style={{ fontSize: 22, color: '#22c55e', marginBottom: 8 }} />
          <Statistic title="Disponibles ahora" value={totalDisponibles} valueStyle={{ color: '#22c55e', fontWeight: 900 }} />
          <p className="kpi-sub">{porcentajeDisponible}% del total</p>
        </div>
        <div className="kpi-card">
          <SwapOutlined style={{ fontSize: 22, color: '#FF6B35', marginBottom: 8 }} />
          <Statistic title="En préstamo activo" value={totalPrestados} valueStyle={{ color: '#FF6B35', fontWeight: 900 }} />
          <p className="kpi-sub">{100 - porcentajeDisponible}% del total</p>
        </div>
      </div>

      <div className="reporte-card full-width">
        <h3 className="reporte-card-titulo">Disponibilidad general del acervo</h3>
        <div className="barra-label" style={{ marginBottom: 12 }}>
          <span>Disponibles vs en préstamo</span>
          <strong>{porcentajeDisponible}% disponible</strong>
        </div>
        <Progress percent={porcentajeDisponible} strokeColor={{ '0%': '#0094A2', '100%': '#22c55e' }} trailColor="rgba(255,107,53,0.2)" strokeWidth={14} strokeLinecap="round" />
      </div>

      <div className="reporte-card full-width">
        <h3 className="reporte-card-titulo">Detalle por título — Indicador CACES 4.5.2</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {libros.map(libro => {
            const pct = Math.round((libro.disponibles / libro.totalEjemplares) * 100)
            return (
              <div key={libro.codigo} className="libro-reporte-item">
                <div className="libro-reporte-header">
                  <div>
                    <span className="libro-reporte-titulo">{libro.titulo}</span>
                    <span className="libro-reporte-autor">{libro.autor} · {libro.anio}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tag color="cyan" style={{ borderRadius: 6 }}>{libro.categoria}</Tag>
                    <Tag color={libro.disponibles > 0 ? 'green' : 'red'} style={{ borderRadius: 6 }}>
                      {libro.disponibles > 0 ? 'Disponible' : 'No disponible'}
                    </Tag>
                  </div>
                </div>
                <div className="libro-reporte-stats">
                  <span>Total: <strong>{libro.totalEjemplares}</strong></span>
                  <span style={{ color: '#0094A2' }}>Disponibles: <strong>{libro.disponibles}</strong></span>
                  <span style={{ color: '#FF6B35' }}>Prestados: <strong>{libro.totalEjemplares - libro.disponibles}</strong></span>
                  <span style={{ color: '#6b7280' }}>Código: <strong>{libro.codigo}</strong></span>
                </div>
                <Progress percent={pct} strokeColor={{ '0%': '#0094A2', '100%': '#22c55e' }} trailColor="rgba(0,0,0,0.06)" strokeWidth={8} strokeLinecap="round" size="small" format={() => `${libro.disponibles}/${libro.totalEjemplares}`} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="reporte-card full-width">
        <h3 className="reporte-card-titulo">Relación acervo — Docentes registrados</h3>
        <div className="relacion-grid">
          <div className="relacion-item"><span className="relacion-num">{libros.length}</span><span className="relacion-label">Títulos únicos</span></div>
          <div className="relacion-sep">÷</div>
          <div className="relacion-item"><span className="relacion-num">{docentes.length}</span><span className="relacion-label">Docentes registrados</span></div>
          <div className="relacion-sep">=</div>
          <div className="relacion-item"><span className="relacion-num" style={{ color: '#0094A2' }}>{(libros.length / docentes.length).toFixed(1)}</span><span className="relacion-label">Títulos por docente</span></div>
        </div>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
          Indicador CACES 4.5.2 — La biblioteca debe mantener una relación adecuada de acervo por usuario registrado.
        </p>
      </div>
    </div>
  )
}

export default Reportes
