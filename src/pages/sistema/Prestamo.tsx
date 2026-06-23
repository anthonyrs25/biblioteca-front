import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, App, Select, DatePicker, Tag } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { SwapOutlined, ArrowLeftOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import { buscarLibros, getProgramas, crearPrestamo } from '../../api/biblioteca'

interface Props {
  docente: any | null
}

const tiposDocumento = [
  { value: 'cedula', label: 'Cédula de identidad' },
  { value: 'carnet', label: 'Carné estudiantil' },
  { value: 'licencia', label: 'Licencia de conducir' },
  { value: 'otro', label: 'Otro documento' },
]

function Prestamo({ docente }: Props) {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [programas, setProgramas] = useState<string[]>([])
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string | undefined>()
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [libroSeleccionado, setLibroSeleccionado] = useState<any | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState<string | undefined>()
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [fechaDevolucion, setFechaDevolucion] = useState<Dayjs>(dayjs().add(14, 'day'))
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    getProgramas().then(setProgramas)
  }, [])

  // Buscar cada vez que cambia el texto o el programa (con un pequeño debounce)
  useEffect(() => {
    if (!texto && !programaSeleccionado) {
      setResultados([])
      return
    }
    const t = setTimeout(() => {
      buscarLibros(texto || undefined, programaSeleccionado).then(setResultados)
    }, 300)
    return () => clearTimeout(t)
  }, [texto, programaSeleccionado])

  if (!docente) { navigate('/sistema'); return null }

  const handleConfirmar = async () => {
    if (!libroSeleccionado) return
    if (!tipoDocumento) { message.warning('Selecciona el tipo de documento de respaldo'); return }
    try {
      await crearPrestamo(docente.id, libroSeleccionado.id)
      setConfirmado(true)
      message.success('Préstamo registrado')
      setTimeout(() => navigate('/sistema'), 2000)
    } catch {
      message.error('Error al registrar el préstamo — verifica que haya ejemplares disponibles')
    }
  }

  if (confirmado) return (
    <div className="page-wrapper">
      <div className="page-card" style={{ textAlign: 'center' }}>
        <SwapOutlined style={{ fontSize: 56, color: '#0d9488', marginBottom: 16 }} />
        <h2 className="perfil-nombre">¡Préstamo registrado!</h2>
        <p className="perfil-depto">Devolución: {fechaDevolucion.format('DD [de] MMMM, YYYY')}</p>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="page-card" style={{ maxWidth: 720 }}>
        <button className="btn-volver" onClick={() => navigate('/sistema/docente')}>
          <ArrowLeftOutlined /> Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <SwapOutlined style={{ fontSize: 36, color: '#0d9488', marginBottom: 12 }} />
          <h2 className="perfil-nombre">Préstamo de libro</h2>
          <p className="perfil-depto">{docente.nombre}</p>
        </div>

        {/* FILTRO DE CARRERA */}
        <div className="form-field">
          <label className="field-label">Carrera (opcional)</label>
          <Select
            placeholder="Filtrar por carrera"
            options={programas.map(p => ({ value: p, label: p }))}
            value={programaSeleccionado}
            onChange={setProgramaSeleccionado}
            allowClear
            style={{ width: '100%' }}
            size="large"
          />
        </div>

        {/* BÚSQUEDA LIBRE */}
        <div className="form-field">
          <label className="field-label">Buscar por título, autor o código</label>
          <Input
            placeholder="Escribe para buscar..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            size="large"
          />
        </div>

        {/* RESULTADOS */}
        {resultados.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
            {resultados.map(libro => (
              <div
                key={libro.id}
                className={`libro-opcion ${libroSeleccionado?.id === libro.id ? 'selected' : ''}`}
                onClick={() => setLibroSeleccionado(libro)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ flex: 1 }}>
                  <p className="libro-titulo" style={{ margin: 0 }}>{libro.titulo}</p>
                  <p className="libro-autor" style={{ margin: 0 }}>{libro.autor} · {libro.anio}</p>
                </div>
                <Tag color={libro.disponibles > 0 ? 'green' : 'red'}>
                  {libro.disponibles} de {libro.totalEjemplares} disp.
                </Tag>
              </div>
            ))}
          </div>
        )}

        {(texto || programaSeleccionado) && resultados.length === 0 && (
          <div className="no-encontrado">No se encontraron libros con esos filtros.</div>
        )}

        {libroSeleccionado && (
          <>
            <div className="libro-resultado" style={{ marginBottom: 20 }}>
              <div className="libro-header">
                <div>
                  <p className="libro-titulo" style={{ margin: 0 }}>{libroSeleccionado.titulo}</p>
                  <p className="libro-autor">{libroSeleccionado.autor} · {libroSeleccionado.anio}</p>
                  <p className="libro-categoria">{libroSeleccionado.categoria}</p>
                </div>
              </div>
              <div className="libro-stock">
                <div className="stock-item">
                  <span className="stock-num">{libroSeleccionado.disponibles}</span>
                  <span className="stock-label">Disponibles</span>
                </div>
                <div className="stock-item">
                  <span className="stock-num">{libroSeleccionado.totalEjemplares}</span>
                  <span className="stock-label">Total ejemplares</span>
                </div>
              </div>
              {libroSeleccionado.disponibles === 0 && (
                <div className="no-disponible">No hay ejemplares disponibles de este libro en este momento.</div>
              )}
            </div>

            {libroSeleccionado.disponibles > 0 && (
              <>
                <div className="documento-row" style={{ marginBottom: 18 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">Documento de respaldo</label>
                    <Select
                      placeholder="Tipo de documento"
                      options={tiposDocumento}
                      value={tipoDocumento}
                      onChange={setTipoDocumento}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">Número <span style={{ color: '#aab1bb', fontWeight: 400 }}>(opcional)</span></label>
                    <Input
                      placeholder="N° de documento"
                      value={numeroDocumento}
                      onChange={e => setNumeroDocumento(e.target.value)}
                      size="large"
                    />
                  </div>
                </div>

                <div className="plazo-card">
                  <div className="plazo-info">
                    <span className="plazo-label">Fecha de devolución</span>
                    <span className="plazo-fecha">{fechaDevolucion.format('DD [de] MMMM, YYYY')}</span>
                  </div>
                  {!mostrarCalendario ? (
                    <Button className="btn-cambiar-fecha" icon={<CalendarOutlined />} onClick={() => setMostrarCalendario(true)}>
                      Cambiar fecha
                    </Button>
                  ) : (
                    <DatePicker
                      value={fechaDevolucion}
                      onChange={(fecha) => { if (fecha) { setFechaDevolucion(fecha); setMostrarCalendario(false) } }}
                      format="DD/MM/YYYY"
                      disabledDate={(fecha) => fecha.isBefore(dayjs(), 'day')}
                      autoFocus
                      open
                      onOpenChange={(open) => { if (!open) setMostrarCalendario(false) }}
                    />
                  )}
                </div>

                <Button className="btn-confirmar" block size="large" onClick={handleConfirmar}>
                  Confirmar préstamo
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Prestamo