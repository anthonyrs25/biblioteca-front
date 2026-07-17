import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Select, App } from 'antd'
import { ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons'
import { crearCuentaStaff } from '../../api/biblioteca'

function GestionStaff() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [creando, setCreando] = useState(false)

  const handleCrear = async () => {
    try {
      const valores = await form.validateFields()
      setCreando(true)
      await crearCuentaStaff(valores)
      message.success('Cuenta creada correctamente')
      form.resetFields()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-card" style={{ maxWidth: 480 }}>
        <button className="btn-volver" onClick={() => navigate('/sistema/gestion')}>
          <ArrowLeftOutlined /> Volver a Gestión
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <UserAddOutlined style={{ fontSize: 32, color: '#00796B', marginBottom: 8 }} />
          <h2 className="perfil-nombre">Nueva cuenta de staff</h2>
          <p className="perfil-depto">Bibliotecario o Administrador — con contraseña propia</p>
        </div>

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