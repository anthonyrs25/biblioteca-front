import { Select, Button, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))
const OPCIONES_JORNADA = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'nocturno', label: 'Nocturno' },
]

// materias se mantiene en el tipo por compatibilidad con el backend, pero ya
// no se pide en la interfaz: la biblioteca decidió registrar solo carrera,
// ciclo y jornada. Siempre viaja como arreglo vacío.
export type CicloAsignado = { numero: number; jornada?: string; materias: string[] }
export type CarreraAsignada = { nombre: string; ciclos: CicloAsignado[] }

interface Props {
  valor: CarreraAsignada[]
  onChange: (v: CarreraAsignada[]) => void
  carrerasDisponibles: string[]
  titulo?: string
  // Estudiante: una sola carrera con un solo ciclo. Docente (por defecto):
  // varias carreras, cada una con varios ciclos.
  carreraUnica?: boolean
}

// Asigna carrera(s), ciclo(s) y jornada a una persona. Las materias se
// eliminaron del flujo — no aportaban al registro y complicaban la carga.
function AsignacionAcademica({
  valor, onChange, carrerasDisponibles,
  titulo = 'Carreras y ciclos',
  carreraUnica = false,
}: Props) {

  // ── Modo estudiante: UNA carrera + UN ciclo con jornada ──
  if (carreraUnica) {
    const carrera = valor[0]

    const elegirCarrera = (nombre?: string) => {
      if (!nombre) { onChange([]); return }
      // Conserva el ciclo/jornada ya elegidos si solo cambia el nombre
      const cicloPrevio = carrera?.ciclos[0] ?? { numero: 1, materias: [] }
      onChange([{ nombre, ciclos: [cicloPrevio] }])
    }

    const actualizarCiclo = (cambios: Partial<CicloAsignado>) => {
      if (!carrera) return
      onChange([{
        ...carrera,
        ciclos: [{ ...carrera.ciclos[0], ...cambios }],
      }])
    }

    return (
      <div>
        <div className="form-field">
          <label className="field-label">{titulo}</label>
          <Select
            placeholder="Selecciona la carrera"
            value={carrera?.nombre}
            onChange={elegirCarrera}
            options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
            style={{ width: '100%' }}
            size="large"
            showSearch
            allowClear
            optionFilterProp="label"
          />
        </div>

        {carrera && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Select
              value={carrera.ciclos[0]?.numero}
              options={OPCIONES_CICLO}
              style={{ flex: 1 }}
              size="large"
              onChange={val => actualizarCiclo({ numero: val })}
            />
            <Select
              value={carrera.ciclos[0]?.jornada}
              placeholder="Jornada"
              allowClear
              options={OPCIONES_JORNADA}
              style={{ flex: 1 }}
              size="large"
              onChange={val => actualizarCiclo({ jornada: val })}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Modo docente: VARIAS carreras, cada una con VARIOS ciclos ──

  // El selector múltiple manda: al elegir carreras se crean o quitan bloques,
  // conservando los ciclos ya cargados de las que se mantienen.
  const cambiarCarreras = (nombres: string[]) => {
    const nuevo = nombres.map(nombre => {
      const existente = valor.find(c => c.nombre === nombre)
      return existente ?? { nombre, ciclos: [{ numero: 1, materias: [] }] }
    })
    onChange(nuevo)
  }

  const actualizarCiclo = (carrera: string, i: number, cambios: Partial<CicloAsignado>) => {
    onChange(valor.map(c => c.nombre !== carrera ? c : {
      ...c,
      ciclos: c.ciclos.map((cc, j) => j === i ? { ...cc, ...cambios } : cc),
    }))
  }

  const agregarCiclo = (carrera: string) => {
    onChange(valor.map(c => c.nombre !== carrera ? c : {
      ...c,
      ciclos: [...c.ciclos, { numero: 1, materias: [] }],
    }))
  }

  const quitarCiclo = (carrera: string, i: number) => {
    onChange(valor.map(c => c.nombre !== carrera ? c : {
      ...c,
      ciclos: c.ciclos.filter((_, j) => j !== i),
    }))
  }

  const quitarCarrera = (nombre: string) => {
    onChange(valor.filter(c => c.nombre !== nombre))
  }

  return (
    <div>
      <div className="form-field">
        <label className="field-label">{titulo}</label>
        <Select
          mode="multiple"
          placeholder="Selecciona una o varias carreras"
          value={valor.map(c => c.nombre)}
          onChange={cambiarCarreras}
          options={carrerasDisponibles.map(c => ({ value: c, label: c }))}
          style={{ width: '100%' }}
          size="large"
          showSearch
          optionFilterProp="label"
        />
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
          Por cada carrera seleccionada aparecerá un bloque para registrar sus
          ciclos y jornadas por separado.
        </p>
      </div>

      {valor.map(carrera => (
        <div
          key={carrera.nombre}
          style={{
            marginBottom: 14, border: '1px solid #B2DFDB', borderRadius: 10,
            padding: 14, background: '#F5FBFA',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ color: '#00695C' }}>{carrera.nombre}</strong>
            <Popconfirm
              title="¿Quitar esta carrera?"
              description="Se eliminarán también sus ciclos."
              onConfirm={() => quitarCarrera(carrera.nombre)}
              okText="Sí, quitar" cancelText="Cancelar"
            >
              <Button size="small" danger>Quitar carrera</Button>
            </Popconfirm>
          </div>

          {carrera.ciclos.map((ciclo, i) => (
            <div
              key={i}
              style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, border: '1px solid #E2E8F0' }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <Select
                  value={ciclo.numero}
                  options={OPCIONES_CICLO}
                  style={{ width: 110 }}
                  onChange={val => actualizarCiclo(carrera.nombre, i, { numero: val })}
                />
                <Select
                  value={ciclo.jornada}
                  placeholder="Jornada"
                  allowClear
                  options={OPCIONES_JORNADA}
                  style={{ width: 130 }}
                  onChange={val => actualizarCiclo(carrera.nombre, i, { jornada: val })}
                />
                {carrera.ciclos.length > 1 && (
                  <Button
                    danger size="small"
                    onClick={() => quitarCiclo(carrera.nombre, i)}
                    style={{ marginLeft: 'auto' }}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => agregarCiclo(carrera.nombre)}
          >
            Agregar otro ciclo en {carrera.nombre}
          </Button>
        </div>
      ))}
    </div>
  )
}

export default AsignacionAcademica
