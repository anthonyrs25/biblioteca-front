import { useState } from 'react'
import { Button, Input, Select, App, Divider } from 'antd'
import { MailOutlined, FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { buscarPorEmail, getEstadoUsuario, getCarreras } from '../api/biblioteca'
import { imprimirCertificado } from '../utils/impresion'
import { useEffect } from 'react'

// Emisión del certificado de no adeudar libros, requisito institucional
// para trámites de titulación.
//
// Si la persona no está registrada en el sistema, el certificado se emite
// igual: quien nunca solicitó un libro no puede adeudarlo. En ese caso NO
// se crea un usuario — hacerlo poblaría la base de personas que nunca
// usaron la biblioteca y distorsionaría las estadísticas.
function EmitirCertificado() {
  const { message } = App.useApp()
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [generando, setGenerando] = useState(false)

  // Datos que se piden solo cuando la persona no está en el sistema
  const [nombre, setNombre] = useState('')
  const [tipoPersona, setTipoPersona] = useState<string>('ESTUDIANTE')
  const [carrera, setCarrera] = useState<string | undefined>()
  const [carrerasDisponibles, setCarrerasDisponibles] = useState<string[]>([])

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  const limpiar = () => {
    setNoEncontrado(false)
    setNombre('')
    setCarrera(undefined)
  }

  const buscar = async () => {
    if (!email.trim()) { message.warning('Ingresa el correo institucional'); return }
    setBuscando(true)
    limpiar()
    try {
      const persona = await buscarPorEmail(email.trim())
      if (persona) {
        // Registrada: se consulta su estado real de préstamos
        const estado = await getEstadoUsuario(persona.id)
        if (!estado?.ok) {
          message.error('No se pudo consultar el estado de préstamos')
          return
        }
        imprimirCertificado(estado)
        message.success(
          estado.alDia
            ? 'Certificado emitido: la persona está al día'
            : `Atención: registra ${estado.pendientes.length} préstamo(s) pendiente(s)`
        )
      } else {
        setNoEncontrado(true)
      }
    } catch {
      setNoEncontrado(true)
    } finally {
      setBuscando(false)
    }
  }

  const emitirSinRegistro = () => {
    if (!nombre.trim()) { message.warning('Ingresa el nombre completo'); return }
    setGenerando(true)
    try {
      imprimirCertificado({
        usuario: {
          nombre: nombre.trim(),
          email: email.trim(),
          tipoPersona,
          carreras: carrera ? [{ carrera: { nombre: carrera } }] : [],
        },
        alDia: true,
        pendientes: [],
        historial: [],
        noRegistrado: true,
      })
      message.success('Certificado emitido')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div>
      <div className="form-field">
        <label className="field-label">Correo institucional de la persona</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="nombre@sudamericano.edu.ec"
            prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
            value={email}
            onChange={e => { setEmail(e.target.value); limpiar() }}
            onPressEnter={buscar}
            size="large"
            autoFocus
          />
          <Button
            type="primary"
            size="large"
            icon={<FilePdfOutlined />}
            onClick={buscar}
            loading={buscando}
            style={{ background: '#00A9A5', borderColor: '#00A9A5' }}
          >
            Emitir
          </Button>
        </div>
        <p style={{ fontSize: 11, color: '#8FA5AE', marginTop: 6 }}>
          Si la persona está registrada, el certificado refleja su historial real de préstamos.
        </p>
      </div>

      {noEncontrado && (
        <>
          <Divider style={{ margin: '18px 0 14px' }}>Persona no registrada</Divider>
          <div style={{
            background: '#E6F7F6', border: '1px solid #9FDEDC',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 12.5, color: '#12303A', margin: 0, lineHeight: 1.6 }}>
              Este correo no figura en el sistema, lo que significa que la persona
              <strong> nunca ha solicitado un préstamo</strong> en la Biblioteca. El certificado
              puede emitirse igualmente: complete los datos que aparecerán en el documento.
            </p>
            <p style={{ fontSize: 11, color: '#5A7480', margin: '8px 0 0' }}>
              No se creará ningún registro en el sistema.
            </p>
          </div>

          <div className="form-field">
            <label className="field-label">Nombre completo</label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} size="large" />
          </div>
          <div className="form-field">
            <label className="field-label">Tipo de persona</label>
            <Select
              value={tipoPersona}
              onChange={setTipoPersona}
              style={{ width: '100%' }}
              size="large"
              options={[
                { value: 'ESTUDIANTE', label: 'Estudiante' },
                { value: 'DOCENTE', label: 'Docente' },
                { value: 'INVITADO', label: 'Invitado / externo' },
              ]}
            />
          </div>
          {tipoPersona !== 'INVITADO' && (
            <div className="form-field">
              <label className="field-label">Carrera <span style={{ color: '#8FA5AE', fontWeight: 400 }}>(opcional)</span></label>
              <Select
                placeholder="Selecciona la carrera"
                value={carrera}
                onChange={setCarrera}
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                size="large"
                options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
              />
            </div>
          )}
          <Button
            block size="large"
            icon={<CheckCircleOutlined />}
            onClick={emitirSinRegistro}
            loading={generando}
            style={{ background: '#00A9A5', borderColor: '#00A9A5', color: '#fff', marginTop: 8 }}
          >
            Emitir certificado
          </Button>
        </>
      )}
    </div>
  )
}

export default EmitirCertificado