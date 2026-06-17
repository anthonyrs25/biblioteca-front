import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, App, Select, DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import {
  SwapOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { libros } from '../../data/libros'
import type { Docente } from '../../data/docentes'

interface Props {
  docente: Docente | null
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

  const [codigo, setCodigo] = useState('')
  const [libroEncontrado, setLibroEncontrado] = useState<typeof libros[0] | null | undefined>(undefined)
  const [tipoDocumento, setTipoDocumento] = useState<string | undefined>()
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [fechaDevolucion, setFechaDevolucion] = useState<Dayjs>(dayjs().add(14, 'day'))
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  if (!docente) { navigate('/sistema'); return null }

  const handleBuscar = () => {
    if (!codigo.trim()) { message.warning('Ingresa un código de libro'); return }
    const encontrado = libros.find(l => l.codigo.toLowerCase() === codigo.trim().toLowerCase())
    setLibroEncontrado(encontrado ?? null)
  }

  const handleConfirmar = () => {
    if (!libroEncontrado) return
    if (!tipoDocumento) { message.warning('Selecciona el tipo de documento de respaldo'); return }
    setConfirmado(true)
    message.success('Préstamo registrado')
    setTimeout(() => navigate('/sistema'), 2000)
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
      <div className="page-card">
        <button className="btn-volver" onClick={() => navigate('/sistema/docente')}>
          <ArrowLeftOutlined /> Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <SwapOutlined style={{ fontSize: 36, color: '#0d9488', marginBottom: 12 }} />
          <h2 className="perfil-nombre">Préstamo de libro</h2>
          <p className="perfil-depto">{docente.nombre}</p>
        </div>

        {/* BÚSQUEDA POR CÓDIGO */}
        <div className="form-field">
          <label className="field-label">Código del libro</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Ej: LIB-001"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              onPressEnter={handleBuscar}
              size="large"
            />
            <Button className="btn-buscar" icon={<SearchOutlined />} onClick={handleBuscar} size="large">
              Buscar
            </Button>
          </div>
        </div>

        {/* RESULTADO */}
        {libroEncontrado === null && (
          <div className="no-encontrado">
            No se encontró ningún libro con ese código.
          </div>
        )}

        {libroEncontrado && (
          <>
            <div className="libro-resultado" style={{ marginBottom: 20 }}>
              <div className="libro-header">
                <div>
                  <p className="libro-titulo" style={{ margin: 0 }}>{libroEncontrado.titulo}</p>
                  <p className="libro-autor">{libroEncontrado.autor} · {libroEncontrado.anio}</p>
                  <p className="libro-categoria">{libroEncontrado.categoria}</p>
                </div>
              </div>

              <div className="libro-stock">
                <div className="stock-item">
                  <span className="stock-num">{libroEncontrado.disponibles}</span>
                  <span className="stock-label">Disponibles</span>
                </div>
                <div className="stock-item">
                  <span className="stock-num">{libroEncontrado.totalEjemplares}</span>
                  <span className="stock-label">Total ejemplares</span>
                </div>
              </div>

              {libroEncontrado.disponibles === 0 && (
                <div className="no-disponible">
                  No hay ejemplares disponibles de este libro en este momento.
                </div>
              )}
            </div>

            {libroEncontrado.disponibles > 0 && (
              <>
                {/* DOCUMENTO DE RESPALDO */}
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

                {/* PLAZO DE DEVOLUCIÓN */}
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

                <Button
                  className="btn-confirmar"
                  block
                  size="large"
                  onClick={handleConfirmar}
                >
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