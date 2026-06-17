import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, App } from 'antd'
import { LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import Logo from '../components/Logo'

function Login() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!usuario || !password) {
      message.warning('Ingresa usuario y contraseña')
      return
    }
    setLoading(true)
    setTimeout(() => {
      // CREDENCIALES — cambia esto cuando tengas backend real
      if (usuario === 'admin' && password === 'biblioteca2026') {
        localStorage.setItem('biblioteca_auth', 'true')
        message.success('Acceso concedido')
        navigate('/sistema')
      } else {
        message.error('Credenciales incorrectas')
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <button className="btn-volver" onClick={() => navigate('/')}>
          <ArrowLeftOutlined /> Volver al inicio
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size="large" />
          <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>
            Acceso exclusivo para personal autorizado
          </p>
        </div>

        <div className="login-form">
          <div className="form-field">
            <label className="field-label">Usuario</label>
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Ingresa tu usuario"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
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
          <Button className="btn-confirmar" block size="large" onClick={handleLogin} loading={loading}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
