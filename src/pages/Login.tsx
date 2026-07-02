import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, App } from 'antd'
import { LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import Logo from '../components/Logo'
import { login } from '../api/biblioteca'

function Login() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      message.warning('Ingresa email y contraseña')
      return
    }
    setLoading(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('biblioteca_token', data.access_token)
      localStorage.setItem('biblioteca_usuario', JSON.stringify(data.usuario))
      message.success('Acceso concedido')
      navigate('/sistema')
    } catch {
      message.error('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <button className="btn-volver" onClick={() => navigate('/')}>
          <ArrowLeftOutlined /> Volver al inicio
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size="large" dark />
          <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>
            Acceso exclusivo para personal autorizado
          </p>
        </div>

        <div className="login-form">
          <div className="form-field">
            <label className="field-label">Correo institucional</label>
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="correo@sudamericano.edu.ec"
              value={email}
              onChange={e => setEmail(e.target.value)}
              size="large"
              onPressEnter={handleLogin}
            />
          </div>
          <div className="form-field">
            <label className="field-label">Contraseña</label>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              size="large"
              onPressEnter={handleLogin}
            />
          </div>
          <Button
            className="btn-confirmar"
            block
            size="large"
            onClick={handleLogin}
            loading={loading}
          >
            Iniciar sesión
          </Button>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 24 }}>
          ¿Problemas para acceder? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  )
}

export default Login