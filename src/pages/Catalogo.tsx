import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Select, Table, Tag, Modal, Statistic, Button, Tooltip } from 'antd'
import { ArrowLeftOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons'
import Logo from '../components/Logo'
import { buscarLibros, getProgramas, getCategorias, registrarEventoPublico } from '../api/biblioteca'
import { nombreCortoPrograma } from '../utils/carreras'

// Si hay una sesión del staff abierta en este navegador (bibliotecario/admin),
// no se registra el evento — así las analíticas solo cuentan visitantes reales.
const trackear = (evento: any) => {
  if (!localStorage.getItem('biblioteca_token')) registrarEventoPublico(evento)
}

function Catalogo() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const programa = searchParams.get('programa') || ''

  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState<string | undefined>()
  const [ordenSel, setOrdenSel] = useState('titulo-asc')
  const [programas, setProgramas] = useState<{ value: string; label: string }[]>([])
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([])
  const [libros, setLibros] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [libroSeleccionado, setLibroSeleccionado] = useState<any | null>(null)

  useEffect(() => {
    getProgramas().then((data: string[]) => {
      setProgramas(
        data
          .map(p => ({ value: p, label: nombreCortoPrograma(p) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      )
    })
  }, [])

  // Las categorías dependen de la carrera elegida — mostrar siempre TODAS las
  // categorías de la biblioteca (aunque no tengan libros de esa carrera)
  // confundía: elegías "Electricidad" y veías "Historia de América" como opción.
  useEffect(() => {
    getCategorias(programa || undefined).then((data: string[]) => {
      setCategorias(data.map(c => ({ value: c, label: c })))
    })
    setCategoria(undefined)
  }, [programa])

  useEffect(() => {
    trackear({ tipo: 'visita_pagina', programa: programa || undefined })
  }, [programa])

  useEffect(() => {
    setCargando(true)
    const [orden, direccion] = ordenSel.split('-')
    const t = setTimeout(() => {
      buscarLibros(texto || undefined, programa || undefined, categoria || undefined, orden, direccion)
        .then(data => {
          setLibros(data)
          if (texto.trim()) {
            trackear({ tipo: 'busqueda', texto: texto.trim(), programa: programa || undefined })
          }
        })
        .finally(() => setCargando(false))
    }, 300)
    return () => clearTimeout(t)
  }, [texto, programa, categoria, ordenSel])

  const cambiarPrograma = (valor: string | undefined) => {
    const params = new URLSearchParams(searchParams)
    if (valor) params.set('programa', valor)
    else params.delete('programa')
    setSearchParams(params)
  }

  // Solo abrir el detalle es una señal real de interés — por eso el tracking va aquí,
  // no en la lista completa (evita inflar "clics" con resultados que el usuario ni miró)
  const abrirDetalle = (libro: any) => {
    setLibroSeleccionado(libro)
    trackear({ tipo: 'clic_libro', libroId: libro.id, programa: programa || undefined })
  }

  const columnas = [
    {
      title: 'Título', dataIndex: 'titulo', key: 'titulo',
      render: (_: string, libro: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1A2332' }}>{libro.titulo}</div>
          <div style={{ fontSize: 12, color: '#4A5568' }}>{libro.autor}</div>
        </div>
      ),
    },
    { title: 'Año', dataIndex: 'anio', key: 'anio', width: 90 },
    {
      title: 'Disponibilidad', dataIndex: 'disponibles', key: 'disponibles', width: 150,
      render: (_: number, libro: any) => (
        <Tag color={libro.disponibles > 0 ? 'green' : 'default'}>
          {libro.disponibles} / {libro.totalEjemplares}
        </Tag>
      ),
    },
  ]

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
          {programa ? (nombreCortoPrograma(programa)) : 'Explora todos los recursos'}
        </h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
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
            style={{ minWidth: 220 }}
            options={programas}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
          <Select
            placeholder="Filtrar por categoría"
            value={categoria}
            onChange={setCategoria}
            allowClear
            size="large"
            style={{ minWidth: 220 }}
            options={categorias}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
          <Select
            value={ordenSel}
            onChange={setOrdenSel}
            size="large"
            style={{ minWidth: 220 }}
            options={[
              { value: 'titulo-asc', label: 'Título (A-Z)' },
              { value: 'titulo-desc', label: 'Título (Z-A)' },
              { value: 'autor-asc', label: 'Autor (A-Z)' },
              { value: 'autor-desc', label: 'Autor (Z-A)' },
              { value: 'anio-desc', label: 'Año (más reciente)' },
              { value: 'anio-asc', label: 'Año (más antiguo)' },
            ]}
          />
        </div>

        <div className="reporte-card">
          <Table
            columns={columnas}
            dataSource={libros}
            rowKey="id"
            loading={cargando}
            onRow={libro => ({ onClick: () => abrirDetalle(libro), style: { cursor: 'pointer' } })}
            pagination={{ pageSize: 15, showTotal: t => `${t} libros` }}
            size="middle"
          />
        </div>
      </section>

      <Modal
        open={!!libroSeleccionado}
        onCancel={() => setLibroSeleccionado(null)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {libroSeleccionado && (
          <div style={{ paddingTop: 8 }}>
            <Tag color="cyan" style={{ marginBottom: 12 }}>
              {nombreCortoPrograma(libroSeleccionado.programa) || libroSeleccionado.categoria}
            </Tag>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A2332', margin: '0 0 4px' }}>
              {libroSeleccionado.titulo}
            </h2>
            <p style={{ color: '#4A5568', margin: '0 0 16px' }}>
              {libroSeleccionado.autor} · {libroSeleccionado.anio}
              {libroSeleccionado.editora ? ` · ${libroSeleccionado.editora}` : ''}
            </p>

            {libroSeleccionado.descripcion && (
              <p style={{ color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
                {libroSeleccionado.descripcion}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
              <Statistic
                title="Disponibles"
                value={libroSeleccionado.disponibles}
                suffix={`/ ${libroSeleccionado.totalEjemplares}`}
                valueStyle={{ fontSize: 20, fontWeight: 700 }}
              />
            </div>

            <Tooltip title="Próximamente disponible para estudiantes, docentes y externos">
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                disabled
                block
                size="large"
              >
                Solicitar reserva (próximamente)
              </Button>
            </Tooltip>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Catalogo