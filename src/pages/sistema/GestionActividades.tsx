import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, App, Popconfirm, Tooltip } from 'antd'
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  EditOutlined, CheckOutlined, CloseOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
import {
  getActividades, crearActividad, actualizarActividad,
  eliminarActividad, limpiarIconosActividades,
} from '../../api/biblioteca'

// Administración de las actividades que aparecen en "Uso de biblioteca".
// Antes solo se podían crear sobre la marcha al registrar un uso; aquí el
// administrador puede además renombrarlas, reordenarlas y eliminarlas, sin
// tocar la base de datos a mano.
function GestionActividades() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [actividades, setActividades] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [nueva, setNueva] = useState('')
  const [agregando, setAgregando] = useState(false)

  // id de la actividad que se está editando y el texto en curso
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [textoEdicion, setTextoEdicion] = useState('')

  const cargar = () => {
    setCargando(true)
    getActividades()
      .then(data => setActividades([...data].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))))
      .catch(() => message.error('No se pudieron cargar las actividades'))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  const agregar = async () => {
    const nombre = nueva.replace(/\s+/g, ' ').trim()
    if (!nombre) return
    setAgregando(true)
    try {
      await crearActividad(nombre)
      setNueva('')
      message.success('Actividad agregada')
      cargar()
    } catch {
      message.error('No se pudo agregar (¿ya existe una con ese nombre?)')
    } finally {
      setAgregando(false)
    }
  }

  const empezarEdicion = (a: any) => {
    setEditandoId(a.id)
    setTextoEdicion(a.nombre)
  }

  const guardarEdicion = async (id: number) => {
    const nombre = textoEdicion.replace(/\s+/g, ' ').trim()
    if (!nombre) { message.warning('El nombre no puede quedar vacío'); return }
    try {
      await actualizarActividad(id, { nombre })
      setEditandoId(null)
      message.success('Actividad actualizada')
      cargar()
    } catch {
      message.error('No se pudo actualizar')
    }
  }

  const borrar = async (id: number) => {
    try {
      await eliminarActividad(id)
      message.success('Actividad eliminada')
      cargar()
    } catch {
      message.error('No se pudo eliminar')
    }
  }

  // Reordena intercambiando el campo `orden` con el vecino y guardando ambos.
  const mover = async (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion
    if (destino < 0 || destino >= actividades.length) return
    const a = actividades[indice]
    const b = actividades[destino]
    try {
      await Promise.all([
        actualizarActividad(a.id, { orden: b.orden ?? destino }),
        actualizarActividad(b.id, { orden: a.orden ?? indice }),
      ])
      cargar()
    } catch {
      message.error('No se pudo reordenar')
    }
  }

  const limpiarEmojis = async () => {
    try {
      const r = await limpiarIconosActividades()
      message.success(`Emojis quitados de ${r.actualizadas ?? 0} actividad(es)`)
      cargar()
    } catch {
      message.error('No se pudieron quitar los emojis')
    }
  }

  const tieneEmojis = actividades.some(a => a.icono)

  return (
    <div className="page-wrapper">
      <div className="page-card" style={{ maxWidth: 640 }}>
        <button className="btn-volver" onClick={() => navigate('/sistema/gestion')}>
          <ArrowLeftOutlined /> Volver a gestión
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 className="perfil-nombre">Actividades de biblioteca</h2>
          <p className="perfil-depto">Las opciones que aparecen al registrar un uso</p>
        </div>

        {/* Agregar nueva */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Input
            placeholder="Nueva actividad (ej: Consulta de libros)"
            value={nueva}
            onChange={e => setNueva(e.target.value)}
            onPressEnter={agregar}
            size="large"
          />
          <Button
            type="primary" icon={<PlusOutlined />} size="large"
            onClick={agregar} loading={agregando} disabled={!nueva.trim()}
            style={{ background: '#00796B', borderColor: '#00796B' }}
          >
            Agregar
          </Button>
        </div>

        {tieneEmojis && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FFF7E6', border: '1px solid #FFE0A3', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 13, color: '#7A5A00' }}>
              Algunas actividades todavía tienen emoji.
            </span>
            <Popconfirm
              title="¿Quitar los emojis de todas las actividades?"
              onConfirm={limpiarEmojis}
              okText="Sí, quitar" cancelText="Cancelar"
            >
              <Button size="small">Quitar emojis</Button>
            </Popconfirm>
          </div>
        )}

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actividades.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px',
                background: '#fff',
              }}
            >
              {/* Reordenar */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Button type="text" size="small" icon={<ArrowUpOutlined />}
                  disabled={i === 0} onClick={() => mover(i, -1)} />
                <Button type="text" size="small" icon={<ArrowDownOutlined />}
                  disabled={i === actividades.length - 1} onClick={() => mover(i, 1)} />
              </div>

              {/* Nombre o edición */}
              {editandoId === a.id ? (
                <>
                  <Input
                    value={textoEdicion}
                    onChange={e => setTextoEdicion(e.target.value)}
                    onPressEnter={() => guardarEdicion(a.id)}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <Tooltip title="Guardar">
                    <Button type="text" icon={<CheckOutlined style={{ color: '#00796B' }} />}
                      onClick={() => guardarEdicion(a.id)} />
                  </Tooltip>
                  <Tooltip title="Cancelar">
                    <Button type="text" icon={<CloseOutlined />} onClick={() => setEditandoId(null)} />
                  </Tooltip>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 500, color: '#12303A' }}>
                    {a.nombre}
                  </span>
                  <Tooltip title="Renombrar">
                    <Button type="text" icon={<EditOutlined />} onClick={() => empezarEdicion(a)} />
                  </Tooltip>
                  <Popconfirm
                    title="¿Eliminar esta actividad?"
                    description="No se podrá usar en nuevos registros."
                    onConfirm={() => borrar(a.id)}
                    okText="Sí, eliminar" cancelText="Cancelar"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </>
              )}
            </div>
          ))}

          {!cargando && actividades.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
              Todavía no hay actividades. Agrega la primera arriba.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GestionActividades
