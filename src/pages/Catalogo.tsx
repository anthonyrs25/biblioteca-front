import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Select, Spin, Empty, Statistic } from 'antd'
import { ArrowLeftOutlined, BookOutlined, SearchOutlined } from '@ant-design/icons'
import Logo from '../components/Logo'
import { buscarLibros, getProgramas } from '../api/biblioteca'

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

function Catalogo() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const programa = searchParams.get('programa') || ''

  const [texto, setTexto] = useState('')
  const [programas, setProgramas] = useState<{ value: string; label: string }[]>([])
  const [libros, setLibros] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    getProgramas().then((data: string[]) => {
      setProgramas(
        data
          .map(p => ({ value: p, label: nombreCorto[p] || p }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      )
    })
  }, [])

  useEffect(() => {
    setCargando(true)
    const t = setTimeout(() => {
      buscarLibros(texto || undefined, programa || undefined)
        .then(setLibros)
        .finally(() => setCargando(false))
    }, 300)
    return () => clearTimeout(t)
  }, [texto, programa])

  const cambiarPrograma = (valor: string | undefined) => {
    const params = new URLSearchParams(searchParams)
    if (valor) params.set('programa', valor)
    else params.delete('programa')
    setSearchParams(params)
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Logo />
        <div className="nav-links">
          <button onClick={() => navigate('/')}>
            <ArrowLeftOutlined style={{ marginRight: 6 }} />
            Volver al inicio
          </button>
        </div>
      </nav>

      <section className="landing-section catalogo-section" style={{ marginTop: 32 }}>
        <div className="section-label">Catálogo</div>
        <h2 className="section-title">
          {programa ? (nombreCorto[programa] || programa) : 'Explora todos los recursos'}
        </h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <Input
            placeholder="Buscar por título, autor o código..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            size="large"
            style={{ flex: '1 1 320px' }}
            allowClear
          />
          <Select
            placeholder="Filtrar por carrera"
            value={programa || undefined}
            onChange={cambiarPrograma}
            allowClear
            size="large"
            style={{ minWidth: 260 }}
            options={programas}
          />
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : libros.length === 0 ? (
          <Empty description="No se encontraron libros con esos criterios" style={{ padding: '60px 0' }} />
        ) : (
          <div className="catalogo-grid">
            {libros.map(libro => (
              <div key={libro.id} className="catalogo-card">
                <div className="catalogo-top">
                  <span className="catalogo-categoria">
                    {nombreCorto[libro.programa] || libro.programa || libro.categoria}
                  </span>
                  <BookOutlined style={{ color: '#00796B', fontSize: 18 }} />
                </div>
                <h3 className="catalogo-titulo">{libro.titulo}</h3>
                <p className="catalogo-autor">{libro.autor} · {libro.anio}</p>
                {libro.descripcion && (
                  <p className="catalogo-desc">
                    {libro.descripcion.length > 140
                      ? libro.descripcion.slice(0, 140) + '…'
                      : libro.descripcion}
                  </p>
                )}
                <div className="catalogo-footer">
                  <Statistic
                    title="Disponibles"
                    value={libro.disponibles}
                    suffix={`/ ${libro.totalEjemplares}`}
                    valueStyle={{ fontSize: 18, fontWeight: 700 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Catalogo