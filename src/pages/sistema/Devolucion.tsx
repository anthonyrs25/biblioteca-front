import { useState } from 'react'
import { Button, App } from 'antd'
import { RollbackOutlined, CheckCircleOutlined, ArrowLeftOutlined, BookOutlined } from '@ant-design/icons'
import { devolverPrestamo, crearRegistro } from '../../api/biblioteca'

interface Props {
  docente: any | null
  onTerminar?: () => void
  enModal?: boolean
}

function Devolucion({ docente, onTerminar, enModal }: Props) {
  const { message } = App.useApp()
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const [confirmado, setConfirmado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  if (!docente) return null

  // Préstamos activos reales que vienen del backend en docente.prestamos
  const prestamosActivos = (docente.prestamos ?? []).filter((p: any) => p.activo)

  const handleDevolver = async () => {
    if (!seleccionado) { message.warning('Selecciona el libro a devolver'); return }
    setGuardando(true)
    try {
      const prestamo = prestamosActivos.find((p: any) => p.id === seleccionado)
      await devolverPrestamo(seleccionado)
      await crearRegistro({
        tipo: 'devolucion',
        docenteId: docente.id,
        libroId: prestamo?.libroId,
        carrera: docente.carreras?.[0]?.carrera?.nombre,
      })
      setConfirmado(true)
      message.success('Devolución registrada')
      setTimeout(() => onTerminar?.(), 1500)
    } catch {
      message.error('Error al registrar la devolución')
    } finally {
      setGuardando(false)
    }
  }

  if (confirmado) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: 64, color: '#00796B', marginBottom: 16 }} />
      <h2 className="perfil-nombre">¡Devolución exitosa!</h2>
      <p className="perfil-depto">{docente.nombre}</p>
    </div>
  )

  const contenido = (
    <>
      {enModal && (
        <button className="btn-volver" onClick={onTerminar}>
          <ArrowLeftOutlined /> Volver
        </button>
      )}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <RollbackOutlined style={{ fontSize: 40, color: '#00796B', marginBottom: 12 }} />
        <h2 className="perfil-nombre">Devolución de libro</h2>
        <p className="perfil-depto">{docente.nombre}</p>
      </div>

      <p className="field-label" style={{ marginBottom: 16 }}>Selecciona el libro a devolver:</p>

      {prestamosActivos.length === 0 ? (
        <div className="no-encontrado">No hay préstamos activos registrados.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {prestamosActivos.map((prestamo: any) => (
            <div key={prestamo.id}
              className={`libro-opcion ${seleccionado === prestamo.id ? 'selected' : ''}`}
              onClick={() => setSeleccionado(prestamo.id)}>
              <BookOutlined style={{ color: '#00796B', fontSize: 18 }} />
              <div style={{ flex: 1 }}>
                <p className="libro-titulo" style={{ margin: 0 }}>{prestamo.libro?.titulo}</p>
                <p className="libro-autor" style={{ margin: 0 }}>{prestamo.libro?.autor}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {prestamosActivos.length > 0 && (
        <Button className="btn-devolucion" block size="large"
          onClick={handleDevolver} loading={guardando}>
          <CheckCircleOutlined /> Confirmar devolución
        </Button>
      )}
    </>
  )

  if (enModal) return <div style={{ padding: 32 }}>{contenido}</div>

  return (
    <div className="page-wrapper">
      <div className="page-card">{contenido}</div>
    </div>
  )
}

export default Devolucion