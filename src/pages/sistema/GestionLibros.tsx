import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, InputNumber, App, Popconfirm, Tag, Select } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, UploadOutlined, SearchOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { getLibros, crearLibro, actualizarLibro, eliminarLibro, buscarLibros, getProgramas, getCategorias, importarLoteLibros, exportarTodosLibros, getPapeleraLibros, restaurarLibro } from '../../api/biblioteca'
import { useModo } from '../../context/ModoContext'
import { nombreCortoPrograma } from '../../utils/carreras'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()

// Alias por campo, tal como aparecen en el Excel institucional real
// (2_INVENTARIO_BIBLIOTECA_DANIEL_PERAZZO_2026.xlsx, 45 columnas verificadas).
const ALIAS_CODIGO = ['CODIGO DE BIBLIOTECA', 'CODIGO INTERNO', 'CODIGO']
const ALIAS_TITULO = ['NOMBRE', 'TITULO']
const ALIAS_AUTOR = ['AUTOR(ES)', 'AUTOR']
const ALIAS_ANIO = ['ANO DE PUBLICACION', 'ANO', 'YEAR']
// Categoría: prioriza el área de conocimiento (más corta, más usable como tag);
// PROGRAMAS se guarda aparte, en su propio campo dedicado (ver ALIAS_PROGRAMA).
const ALIAS_CATEGORIA = ['AREA DE CONOCIMIENTO', 'PROGRAMAS', 'CATEGORIA']
const ALIAS_PROGRAMA = ['PROGRAMAS']
const ALIAS_TOTAL = ['TOTAL', 'EJEMPLARES']
const ALIAS_DISPONIBLES = ['DISPONIBLES']
const ALIAS_DESCRIPCION = ['RESUMEN', 'DESCRIPCION']
const ALIAS_ISBN = ['CODIGO ISBN', 'ISBN']
const ALIAS_DEWEY = ['CODIGO DEWEY']
const ALIAS_CUTTER = ['CODIGO CUTTER']
const ALIAS_EDICION = ['EDICION']
const ALIAS_PAGINAS = ['PAGINAS']
const ALIAS_EDITORIAL = ['EDITORA', 'EDITORIAL']
const ALIAS_IDIOMA = ['IDIOMA']
const ALIAS_SOLO_SALA = ['PRESTAMO SOLO EN SALA']
const ALIAS_PALABRAS_CLAVE = ['PALABRAS CLAVE']
const ALIAS_CITA = ['CITA BIBLIOGRAFICA']
const ALIAS_TIPO = ['TIPO DE ELEMENTO']

// Todas las columnas reales del Excel institucional, en su orden real —
// usadas tanto para la plantilla descargable como para la exportación,
// así el archivo que se descarga es 100% reimportable sin fricción.
const ENCABEZADOS_OFICIALES = [
  'Nº', 'TIPO DE ELEMENTO', 'ES FÍSICO', 'ES DIGITAL', 'CÓDIGO INTERNO', 'NOMBRE', 'NOMBRE 2',
  'CÓDIGO ISBN', 'CÓDIGO DEWEY', 'CÓDIGO CUTTER', 'CÓDIGO DE BIBLIOTECA', 'TIPO DE INGRESO',
  'DONADO POR', 'NÚMERO DE FACTURA', 'NIVEL DE EDUCACIÓN', 'ÁREA DE CONOCIMIENTO', 'FECHA DE INGRESO',
  'TUTOR', 'UBICACIÓN FÍSICA', 'PERCHA', 'HILERA', 'AUTOR(ES)', 'AUTOR CORPORATIVO',
  'AÑO DE PUBLICACIÓN', 'EMISIÓN', 'EDICIÓN', 'No. PÁGINAS', 'EDITORA', 'LUGAR DE PUBLICACIÓN',
  'TOMO', 'VOLUMEN', 'IDIOMA', 'ESTABLECIMIENTO RESPONSABLE', 'DESCRIPCIÓN FÍSICA',
  'PRÉSTAMO SOLO EN SALA', 'COSTO', 'IMAGEN', 'IMAGEN DE ÍNDICE', 'COLECCIÓN',
  'ELEMENTO DE REFERENCIA', 'PROGRAMAS', 'ELEMENTOS A INGRESAR', 'PALABRAS CLAVE', 'RESUMEN',
  'CITA BIBLIOGRÁFICA',
]

// Encuentra la fila real de encabezados: el Excel institucional trae una fila
// de título de sección arriba de los encabezados verdaderos (por eso no basta
// con asumir que la fila 1 siempre tiene los nombres de columna)
function encontrarFilaEncabezado(sheet: XLSX.WorkSheet): number {
  const filas: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
  for (let i = 0; i < Math.min(filas.length, 5); i++) {
    const fila = (filas[i] || []).map(c => normalizar(String(c ?? '')))
    const tieneCodigo = ALIAS_CODIGO.some(a => fila.some(c => c.includes(normalizar(a))))
    const tieneTitulo = ALIAS_TITULO.some(a => fila.some(c => c.includes(normalizar(a))))
    if (tieneCodigo && tieneTitulo) return i
  }
  return 0
}

const obtenerValor = (row: Record<string, any>, aliases: string[]): string => {
  const claves = Object.keys(row)
  for (const alias of aliases) {
    const clave = claves.find(k => normalizar(k).includes(normalizar(alias)))
    if (clave && row[clave] !== undefined && row[clave] !== null && String(row[clave]).trim()) {
      return String(row[clave]).trim()
    }
  }
  return ''
}

function GestionLibros() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { modoAdminActivo } = useModo()
  const [libros, setLibros] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form] = Form.useForm()
  const [busqueda, setBusqueda] = useState('')
  const [programa, setPrograma] = useState('')
  const [categoria, setCategoria] = useState('')
  const [programas, setProgramas] = useState<{ value: string; label: string }[]>([])
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([])
  const [pageSize, setPageSize] = useState(25)
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modalPapelera, setModalPapelera] = useState(false)
  const [papelera, setPapelera] = useState<any[]>([])
  const [cargandoPapelera, setCargandoPapelera] = useState(false)

  const abrirPapelera = () => {
    setModalPapelera(true)
    setCargandoPapelera(true)
    getPapeleraLibros().then(setPapelera).finally(() => setCargandoPapelera(false))
  }

  const handleRestaurar = async (id: number) => {
    try {
      await restaurarLibro(id)
      message.success('Libro restaurado')
      setPapelera(papelera.filter(l => l.id !== id))
      cargarLibros()
    } catch {
      message.error('Error al restaurar el libro')
    }
  }

  const cargarLibros = () => {
    setCargando(true)
    const promesa = busqueda || programa || categoria
      ? buscarLibros(busqueda || undefined, programa || undefined, categoria || undefined)
      : getLibros()
    promesa
      .then(setLibros)
      .catch(() => message.error('Error al cargar los libros'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    getProgramas().then(data => {
      const opciones = data
        .map((p: string) => ({ value: p, label: nombreCortoPrograma(p) }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label))
      setProgramas(opciones)
    })
  }, [])

  // Las categorías dependen de la carrera elegida — mostrar siempre TODAS
  // las categorías (aunque no tengan libros de esa carrera) confundía.
  useEffect(() => {
    getCategorias(programa || undefined).then((data: string[]) => {
      setCategorias(data.map(c => ({ value: c, label: c })))
    })
    setCategoria('')
  }, [programa])

  useEffect(() => {
    const t = setTimeout(() => { cargarLibros() }, 300)
    return () => clearTimeout(t)
  }, [busqueda, programa, categoria])

  const abrirCrear = () => { setEditando(null); form.resetFields(); setModalAbierto(true) }
  const abrirEditar = (libro: any) => { setEditando(libro); form.setFieldsValue(libro); setModalAbierto(true) }

  const handleGuardar = async () => {
    try {
      const valores = await form.validateFields()
      if (editando) {
        await actualizarLibro(editando.id, valores)
        message.success('Libro actualizado')
      } else {
        await crearLibro(valores)
        message.success('Libro creado')
      }
      setModalAbierto(false)
      cargarLibros()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('Error al guardar el libro')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await eliminarLibro(id)
      message.success('Libro eliminado')
      cargarLibros()
    } catch {
      message.error('Error al eliminar el libro')
    }
  }

  // La plantilla descargable usa exactamente las mismas 45 columnas del Excel
  // institucional real, en el mismo orden — así el bibliotecario puede usarla
  // como base y el archivo siempre es reimportable sin fricción.
  const descargarPlantilla = () => {
    const hoja = XLSX.utils.aoa_to_sheet([ENCABEZADOS_OFICIALES])
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Plantilla')
    XLSX.writeFile(libro, 'plantilla-biblioteca-daniel-perazzo.xlsx')
  }

  const exportarTodo = async () => {
    try {
      message.loading({ content: 'Generando exportación...', key: 'export' })
      const todos = await exportarTodosLibros()
      const filas = todos.map((l: any) => ({
        'TIPO DE ELEMENTO': l.tipo,
        'CÓDIGO ISBN': l.isbn,
        'CÓDIGO DEWEY': l.codigoDewey,
        'CÓDIGO CUTTER': l.codigoCutter,
        'CÓDIGO DE BIBLIOTECA': l.codigo,
        'ÁREA DE CONOCIMIENTO': l.categoria,
        'NOMBRE': l.titulo,
        'AUTOR(ES)': l.autor,
        'AÑO DE PUBLICACIÓN': l.anio,
        'EDICIÓN': l.edicion,
        'No. PÁGINAS': l.paginas,
        'EDITORA': l.editorial,
        'IDIOMA': l.idioma,
        'PRÉSTAMO SOLO EN SALA': l.soloEnSala ? 'SI' : 'NO',
        'PROGRAMAS': l.programa,
        'PALABRAS CLAVE': l.palabrasClave,
        'RESUMEN': l.descripcion,
        'CITA BIBLIOGRÁFICA': l.citaBibliografica,
      }))
      const hoja = XLSX.utils.json_to_sheet(filas)
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Catálogo completo')
      const fecha = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(libro, `catalogo-biblioteca-${fecha}.xlsx`)
      message.success({ content: `Exportados ${todos.length} libros`, key: 'export' })
    } catch {
      message.error({ content: 'No se pudo generar la exportación', key: 'export' })
    }
  }

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      const filaEncabezado = encontrarFilaEncabezado(sheet)
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: filaEncabezado })

      if (rows.length === 0) {
        message.error('El archivo está vacío')
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Validar que tenga las columnas requeridas (por alias, sin importar tildes)
      const columnasArchivo = Object.keys(rows[0]).map(k => normalizar(k))
      const tieneAlias = (aliases: string[]) =>
        aliases.some(alias => columnasArchivo.some(c => c.includes(normalizar(alias))))

      const faltantes: string[] = []
      if (!tieneAlias(ALIAS_CODIGO)) faltantes.push('Código')
      if (!tieneAlias(ALIAS_TITULO)) faltantes.push('Título')
      if (!tieneAlias(ALIAS_AUTOR)) faltantes.push('Autor')

      if (faltantes.length > 0) {
        message.error(`El archivo no tiene el formato correcto. Columnas faltantes: ${faltantes.join(', ')}.`)
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Filtrar filas basura: encabezados repetidos y títulos de sección Dewey
      // (ej. "100 FILOSOFÍA & PSICOLOGÍA") que el Excel institucional reinserta
      // cada vez que cambia de categoría — ambos casos no tienen código real.
      const filasValidas = rows.filter(row => {
        const codigoValor = normalizar(obtenerValor(row, ALIAS_CODIGO))
        const esEncabezadoRepetido = ALIAS_CODIGO.some(a => codigoValor === normalizar(a))
        return codigoValor && !esEncabezadoRepetido
      })

      const librosParaCrear = filasValidas
        .map(row => ({
          codigo: obtenerValor(row, ALIAS_CODIGO),
          titulo: obtenerValor(row, ALIAS_TITULO),
          autor: obtenerValor(row, ALIAS_AUTOR),
          anio: parseInt(obtenerValor(row, ALIAS_ANIO)) || new Date().getFullYear(),
          categoria: obtenerValor(row, ALIAS_CATEGORIA) || 'SIN CATEGORÍA',
          totalEjemplares: parseInt(obtenerValor(row, ALIAS_TOTAL)) || 1,
          disponibles: parseInt(obtenerValor(row, ALIAS_DISPONIBLES) || obtenerValor(row, ALIAS_TOTAL)) || 1,
          descripcion: obtenerValor(row, ALIAS_DESCRIPCION) || obtenerValor(row, ALIAS_TITULO),
          tipo: obtenerValor(row, ALIAS_TIPO) || undefined,
          isbn: obtenerValor(row, ALIAS_ISBN) || undefined,
          codigoDewey: obtenerValor(row, ALIAS_DEWEY) || undefined,
          codigoCutter: obtenerValor(row, ALIAS_CUTTER) || undefined,
          edicion: obtenerValor(row, ALIAS_EDICION) || undefined,
          paginas: parseInt(obtenerValor(row, ALIAS_PAGINAS)) || undefined,
          editorial: obtenerValor(row, ALIAS_EDITORIAL) || undefined,
          idioma: obtenerValor(row, ALIAS_IDIOMA) || undefined,
          soloEnSala: normalizar(obtenerValor(row, ALIAS_SOLO_SALA)) === 'SI',
          programa: obtenerValor(row, ALIAS_PROGRAMA) || undefined,
          palabrasClave: obtenerValor(row, ALIAS_PALABRAS_CLAVE) || undefined,
          citaBibliografica: obtenerValor(row, ALIAS_CITA) || undefined,
        }))
        .filter(l => l.codigo && l.titulo && l.autor)

      if (librosParaCrear.length === 0) {
        message.warning('No se encontró ninguna fila válida con código, título y autor.')
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Un solo request para todo el lote, en vez de una petición por libro
      const resultado = await importarLoteLibros(librosParaCrear)

      const partes = []
      if (resultado.creados > 0) partes.push(`${resultado.creados} nuevo${resultado.creados > 1 ? 's' : ''}`)
      if (resultado.actualizados > 0) partes.push(`${resultado.actualizados} actualizado${resultado.actualizados > 1 ? 's' : ''}`)
      message.success(`Importación completada: ${partes.join(', ') || 'sin cambios'}.`)
      cargarLibros()
    } catch (err: any) {
      console.error('Error al importar Excel:', err)
      const detalle = err?.response?.data?.message || err?.message || 'error desconocido'
      message.error(`No se pudo completar la importación (${detalle}). Revisa la consola del navegador (F12) para más detalle.`, 6)
    } finally {
      setImportando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const columnas = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 130 },
    {
      title: 'Título', dataIndex: 'titulo', key: 'titulo',
      sorter: (a: any, b: any) => a.titulo.localeCompare(b.titulo),
    },
    {
      title: 'Autor', dataIndex: 'autor', key: 'autor',
      sorter: (a: any, b: any) => a.autor.localeCompare(b.autor),
    },
    {
      title: 'Año', dataIndex: 'anio', key: 'anio', width: 90,
      sorter: (a: any, b: any) => (a.anio || 0) - (b.anio || 0),
    },
    {
      title: 'Categoría', dataIndex: 'categoria', key: 'categoria',
      render: (cat: string) => <Tag color="cyan">{cat}</Tag>,
    },
    {
      title: 'Total', dataIndex: 'totalEjemplares', key: 'total', width: 70,
      sorter: (a: any, b: any) => a.totalEjemplares - b.totalEjemplares,
    },
    {
      title: 'Disponibles', dataIndex: 'disponibles', key: 'disponibles', width: 100,
      sorter: (a: any, b: any) => a.disponibles - b.disponibles,
      render: (val: number) => <Tag color={val > 0 ? 'green' : 'red'}>{val}</Tag>,
    },
    {
      title: 'Acciones', key: 'acciones', width: 100,
      render: (_: any, libro: any) => modoAdminActivo ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(libro)} />
          <Popconfirm
            title="¿Eliminar este libro?"
            description="Se moverá a la papelera — se puede restaurar después."
            onConfirm={() => handleEliminar(libro.id)}
            okText="Sí, eliminar" cancelText="Cancelar"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ) : <span style={{ color: '#CBD5E1' }}>—</span>,
    },
  ]

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <button className="btn-volver" onClick={() => navigate('/sistema')}>
            <ArrowLeftOutlined /> Volver al sistema
          </button>
          <h1 className="reportes-titulo">
            <BookOutlined style={{ marginRight: 12, color: '#00796B' }} />
            Gestión de Libros
          </h1>
          <p className="reportes-subtitulo">Agrega, edita o elimina títulos del catálogo · {libros.length} libros</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportarExcel} />
          {modoAdminActivo && (
            <Button icon={<DeleteOutlined />} onClick={abrirPapelera}>
              Papelera
            </Button>
          )}
          <Button icon={<FileExcelOutlined />} onClick={descargarPlantilla}>
            Descargar plantilla
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportarTodo}>
            Exportar todo
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} loading={importando}>
            Importar Excel
          </Button>
          <Button className="btn-exportar" icon={<PlusOutlined />} onClick={abrirCrear} size="large">
            Nuevo libro
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Buscar por título, autor o código..."
          allowClear
          style={{ maxWidth: 380 }}
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          onChange={e => setBusqueda(e.target.value)}
          value={busqueda}
        />
        <Select
          placeholder="Todos los programas"
          allowClear
          style={{ minWidth: 220 }}
          value={programa || undefined}
          onChange={val => setPrograma(val || '')}
          options={programas}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <Select
          placeholder="Todas las categorías"
          allowClear
          style={{ minWidth: 220 }}
          value={categoria || undefined}
          onChange={val => setCategoria(val || '')}
          options={categorias}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: 13, color: '#4A5568' }}>Mostrar:</span>
          <Select
            value={pageSize}
            onChange={setPageSize}
            style={{ width: 100 }}
            options={[
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
              { value: 9999, label: 'Todos' },
            ]}
          />
        </div>
      </div>

      <div className="reporte-card">
        <Table
          columns={columnas}
          dataSource={libros}
          rowKey="id"
          loading={cargando}
          pagination={pageSize >= 9999 ? false : { pageSize, showSizeChanger: false, showTotal: (total) => `${total} libros` }}
          scroll={{ x: true }}
        />
      </div>

      <Modal
        title={editando ? 'Editar libro' : 'Nuevo libro'}
        open={modalAbierto}
        onOk={handleGuardar}
        onCancel={() => setModalAbierto(false)}
        okText={editando ? 'Guardar cambios' : 'Crear libro'}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input placeholder="Ej: LIT.863.271V" disabled={!!editando} />
          </Form.Item>
          <Form.Item name="titulo" label="Título" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="autor" label="Autor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="categoria" label="Categoría" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="totalEjemplares" label="Total ejemplares" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="disponibles" label="Disponibles" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Papelera de libros"
        open={modalPapelera}
        onCancel={() => setModalPapelera(false)}
        footer={null}
        width={700}
      >
        {papelera.length === 0 && !cargandoPapelera ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>La papelera está vacía.</p>
        ) : (
          <Table
            dataSource={papelera}
            loading={cargandoPapelera}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            size="small"
            columns={[
              { title: 'Código', dataIndex: 'codigo', width: 110 },
              { title: 'Título', dataIndex: 'titulo' },
              { title: 'Autor', dataIndex: 'autor' },
              {
                title: '', key: 'restaurar', width: 110,
                render: (_: any, libro: any) => (
                  <Button size="small" onClick={() => handleRestaurar(libro.id)}>Restaurar</Button>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default GestionLibros