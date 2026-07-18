import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Select, App, Table, Tag, Popconfirm, Divider } from 'antd'
import { ArrowLeftOutlined, UserAddOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons'
import { crearCuentaStaff, getDocentes, eliminarDocente } from '../../api/biblioteca'

function GestionStaff() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [creando, setCreando] = useState(false)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  const cargarCuentas = () => {
    setCargando(true)
    getDocentes('STAFF').then(setCuentas).finally(() => setCargando(false))
  }

  useEffect(() => { cargarCuentas() }, [])

  const handleCrear = async () => {
    try {
      const valores = await form.validateFields()
      setCreando(true)
      await crearCuentaStaff(valores)
      message.success('Cuenta creada correctamente')
      form.resetFields()
      cargarCuentas()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setCreando(false)
    }
  }

  const handleDesactivar = async (id: number) => {
    try {
      await eliminarDocente(id)
      message.success('Cuenta desactivada')
      cargarCuentas()
    } catch {
      message.error('Error al desactivar la cuenta')
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-card" style={{ maxWidth: 640 }}>
        <button className="btn-volver" onClick={() => navigate('/sistema/gestion')}>
          <ArrowLeftOutlined /> Volver a Gestión
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <UserAddOutlined style={{ fontSize: 32, color: '#00796B', marginBottom: 8 }} />
          <h2 className="perfil-nombre">Cuentas del sistema</h2>
          <p className="perfil-depto">Bibliotecarios y administradores con acceso al sistema</p>
        </div>

        <Table
          dataSource={cuentas}
          loading={cargando}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ marginBottom: 28 }}
          columns={[
            { title: 'Nombre', dataIndex: 'nombre' },
            { title: 'Correo', dataIndex: 'email' },
            {
              title: 'Rol', dataIndex: 'rol',
              render: (rol: string) => (
                <Tag color={rol === 'admin' ? 'gold' : 'blue'}>
                  {rol === 'admin' && <CrownOutlined style={{ marginRight: 4 }} />}
                  {rol === 'admin' ? 'Administrador' : 'Bibliotecario'}
                </Tag>
              ),
            },
            {
              title: '', key: 'acciones', width: 60,
              render: (_: any, cuenta: any) => (
                <Popconfirm
                  title="¿Desactivar esta cuenta?"
                  description="Deja de poder iniciar sesión de inmediato. Se puede restaurar después."
                  onConfirm={() => handleDesactivar(cuenta.id)}
                  okText="Sí, desactivar" cancelText="Cancelar"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />

        <Divider>Crear cuenta nueva</Divider>

        <Form form={form} layout="vertical">
          <Form.Item name="nombre" label="Nombre completo" rules={[{ required: true, message: 'Ingresa el nombre' }]}>
            <Input size="large" placeholder="Ej: María Torres" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo institucional"
            rules={[{ required: true, message: 'Ingresa el correo' }, { type: 'email', message: 'Correo inválido' }]}
          >
            <Input size="large" placeholder="nombre@sudamericano.edu.ec" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, message: 'Ingresa una contraseña' }, { min: 6, message: 'Mínimo 6 caracteres' }]}
          >
            <Input.Password size="large" placeholder="Mínimo 6 caracteres" />
          </Form.Item>
          <Form.Item name="rol" label="Rol" rules={[{ required: true, message: 'Selecciona el rol' }]}>
            <Select
              size="large"
              placeholder="Selecciona el rol"
              options={[
                { value: 'bibliotecario', label: 'Bibliotecario' },
                { value: 'admin', label: 'Administrador' },
              ]}
            />
          </Form.Item>
          <Button className="btn-confirmar" block size="large" onClick={handleCrear} loading={creando}>
            Crear cuenta
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default GestionStaff