import { useState, useEffect, useRef } from 'react'
import { Button, Input, Select, App, Divider, AutoComplete } from 'antd'
import { MailOutlined, FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { buscarPorEmail, getEstadoUsuario, getCarreras, buscarUsuarios } from '../api/biblioteca'
import { imprimirCertificado } from '../utils/impresion'

const DOMINIO = '@sudamericano.edu.ec'

// Une la parte local con el dominio. Si ya trae arroba, se respeta tal cual.
function componerCorreo(parteLocal: string): string {
  const limpio = parteLocal.trim()
  if (!limpio) return ''
  if (limpio.includes('@')) return limpio
  return limpio + DOMINIO
}

interface Props {
  // Si se pasa un usuario ya elegido (por ejemplo, filtrado en Reportes), el
  // certificado se emite directo para esa persona al abrir, sin buscar de nuevo.
  usuarioPrecargado?: { id: number; nombre?: string } | null
}

// Emisión del certificado de no adeudar libros, requisito institucional
// para trámites de titulación. Es un documento SOLO para estudiantes.
//
// Si la persona no está registrada en el sistema, el certificado se emite
// igual: quien nunca solicitó un libro no puede adeudarlo. En ese caso NO
// se crea un usuario — hacerlo poblaría la base de personas que nunca
// usaron la biblioteca y distorsionaría las estadísticas.
function EmitirCertificado({ usuarioPrecargado }: Props) {
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

  // Autocompletado por nombre o correo, acotado a estudiantes
  const [sugerencias, setSugerencias] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getCarreras().then((data: any[]) => setCarrerasDisponibles(data.map(c => c.nombre)))
  }, [])

  // Emite el certificado de una persona ya registrada a partir de su id.
  const emitirParaId = async (id: number) => {
    setGenerando(true)
    try {
      const estado = await getEstadoUsuario(id)
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
    } catch {
      message.error('No se pudo generar el certificado — revisa la conexión')
    } finally {
      setGenerando(false)
    }
  }

  // Si llega un usuario precargado (elegido en Reportes), se emite directo.
  useEffect(() => {
    if (usuarioPrecargado?.id) emitirParaId(usuarioPrecargado.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioPrecargado])

  const limpiar = () => {
    setNoEncontrado(false)
    setNombre('')
    setCarrera(undefined)
  }

  // Busca coincidencias mientras se escribe, solo entre estudiantes.
  const buscarSugerencias = (texto: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (texto.trim().length < 2) { setSugerencias([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarUsuarios(texto.trim(), 'ESTUDIANTE')
        setSugerencias(resultados ?? [])
      } catch {
        setSugerencias([])
      }
    }, 300)
  }

  const opcionesSugerencia = sugerencias.map(u => ({
    value: String(u.id),
    label: (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
        {u.email && <span style={{ fontSize: 12, color: '#94A3B8' }}>{u.email}</span>}
      </div>
    ),
  }))

  const elegirSugerencia = (id: string) => {
    const usuario = sugerencias.find(u => String(u.id) === id)
    if (usuario) emitirParaId(usuario.id)
  }

  const buscar = async () => {
    const correo = componerCorreo(email)
    if (!correo) { message.warning('Ingresa el correo o el nombre del estudiante'); return }
    setBuscando(true)
    limpiar()
    try {
      const persona = await buscarPorEmail(correo)
      if (persona) {
        await emitirParaId(persona.id)
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
          email: componerCorreo(email),
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

  // Cuando se emite directo por un usuario precargado, no se muestra el buscador.
  if (usuarioPrecargado?.id) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <FilePdfOutlined style={{ fontSize: 34, color: '#00A9A5' }} />
        <p style={{ marginTop: 12, color: '#12303A' }}>
          {generando
            ? `Generando el certificado de ${usuarioPrecargado.nombre ?? 'el estudiante'}...`
            : `Certificado de ${usuarioPrecargado.nombre ?? 'el estudiante'} listo. Se abrió el diálogo de impresión.`}
        </p>
        {!generando && (
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => emitirParaId(usuarioPrecargado.id)}
            style={{ background: '#00A9A5', borderColor: '#00A9A5', marginTop: 8 }}
          >
            Volver a generar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="form-field">
        <label className="field-label">Buscar estudiante por nombre o correo</label>
        <AutoComplete
          options={opcionesSugerencia}
          onSearch={buscarSugerencias}
          onSelect={elegirSugerencia}
          style={{ width: '100%', marginBottom: 14 }}
          size="large"
          placeholder="Escribe el nombre o correo del estudiante"
        />

        <label className="field-label">O ingresa el correo institucional</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="nombre.apellido"
            prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
            suffix={<span style={{ color: '#94A3B8', fontSize: 13 }}>{DOMINIO}</span>}
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
          Si el estudiante está registrado, el certificado refleja su historial real de préstamos.
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
