import { Select, Button, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const OPCIONES_CICLO = [1, 2, 3, 4].map(n => ({ value: n, label: `${n}° Ciclo` }))
const OPCIONES_JORNADA = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'nocturno', label: 'Nocturno' },
]

export type CicloAsignado = { numero: number; jornada?: string; materias: string[] }
export type CarreraAsignada = { nombre: string; ciclos: CicloAsignado[] }

interface Props {
  valor: CarreraAsignada[]
  onChange: (v: CarreraAsignada[]) => void
  carrerasDisponibles: string[]
  // { "Desarrollo de Software": ["Base de Datos", ...] } — sugerencias por carrera
  materiasPorCarrera: Record<string, string[]>
  titulo?: string
}

// Permite asignar VARIAS carreras a una persona, y dentro de cada carrera
// varios ciclos con su jornada y sus materias. Las materias se sugieren
// filtradas por la carrera del bloque, para no mezclar entre carreras.
function AsignacionAcademica({
  valor, onChange, carrerasDisponibles, materiasPorCarrera,
  titulo = 'Carreras, ciclos y materias',
}: Props) {

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

  // Sugerencias del bloque: las materias ya registradas en ESA carrera,
  // más las que se estén escribiendo ahora, sin duplicados.
  const sugerencias = (carrera: CarreraAsignada) => {
    const previas = materiasPorCarrera[carrera.nombre] ?? []
    const locales = carrera.ciclos.flatMap(c => c.materias)
    return [...new Set([...previas, ...locales])].sort()
      .map(m => ({ value: m, label: m }))
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
          ciclos, jornadas y materias por separado.
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
              description="Se eliminarán también sus ciclos y materias."
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
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
              <Select
                mode="tags"
                value={ciclo.materias}
                placeholder={`Materias de ${carrera.nombre}`}
                options={sugerencias(carrera)}
                tokenSeparators={[',']}
                style={{ width: '100%' }}
                onChange={(vals: string[]) => actualizarCiclo(carrera.nombre, i, { materias: vals })}
              />
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