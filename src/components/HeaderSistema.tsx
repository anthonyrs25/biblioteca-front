import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Switch, Tag } from 'antd'
import {
    WifiOutlined, TeamOutlined, LogoutOutlined,
    BarChartOutlined, SettingOutlined, CrownOutlined, HomeOutlined,
} from '@ant-design/icons'
import Logo from './Logo'
import { esKioscoActivo, setKioscoActivo } from '../api/biblioteca'
import { useModo } from '../context/ModoContext'

interface Props {
    onAbrirRegistroManual: () => void
}

// Header del sistema, fijo y presente en todas las pantallas internas.
// Antes vivía solo en la pantalla de inicio, lo que obligaba a volver
// atrás para acceder a Reportes, Gestión o al registro manual.
//
// Distribución en tres zonas para repartir el espacio de forma pareja:
//   - Izquierda: logo + nombre de la biblioteca
//   - Centro:    navegación (Inicio, Reportes, Registro manual, Gestión)
//   - Derecha:   estados y sesión (modo, Lector RFID, Salir)
function HeaderSistema({ onAbrirRegistroManual }: Props) {
    const navigate = useNavigate()
    const {
        esAdmin,
        modoAdminActivo,
        activarModoAdmin,
        volverAModoBibliotecario
    } = useModo()

    const [kiosco, setKiosco] = useState(esKioscoActivo())

    useEffect(() => {
        document.body.classList.toggle('modo-admin', modoAdminActivo)

        return () => {
            document.body.classList.remove('modo-admin')
        }
    }, [modoAdminActivo])

    const cambiarKiosco = (activo: boolean) => {
        setKioscoActivo(activo)
        setKiosco(activo)
    }

    const handleLogout = () => {
        localStorage.removeItem('biblioteca_token')
        localStorage.removeItem('biblioteca_usuario')
        navigate('/')
    }

    return (
        <div className="home-header header-fijo">
            {/* ── Izquierda: identidad ── */}
            <div className="header-zona-izq" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema')}>
                <Logo />
            </div>

            {/* ── Centro: navegación ── */}
            <nav className="header-zona-centro">
                <Button onClick={() => navigate('/sistema')} icon={<HomeOutlined />} className="btn-reportes">
                    Inicio
                </Button>
                <Button onClick={() => navigate('/sistema/reportes')} icon={<BarChartOutlined />} className="btn-reportes">
                    Reportes
                </Button>
                <Button onClick={onAbrirRegistroManual} icon={<TeamOutlined />} className="btn-reportes">
                    Registro manual
                </Button>
                <Button onClick={() => navigate('/sistema/gestion')} icon={<SettingOutlined />} className="btn-reportes">
                    Gestión
                </Button>
            </nav>

            {/* ── Derecha: estados y sesión ── */}
            <div className="header-zona-der">
                {esAdmin && (
                    <div className={`modo-badge ${modoAdminActivo ? 'admin' : 'bibliotecario'}`}>
                        <Tag color={modoAdminActivo ? 'gold' : 'cyan'} style={{ margin: 0 }}>
                            {modoAdminActivo ? <><CrownOutlined /> Administrador</> : 'Bibliotecario'}
                        </Tag>
                        <Switch
                            checked={modoAdminActivo}
                            onChange={checked => checked ? activarModoAdmin() : volverAModoBibliotecario()}
                            size="small"
                        />
                    </div>
                )}
                <div className="rfid-toggle" style={{ background: kiosco ? '#E0F2F1' : '#F5F7FA' }}>
                    <Tag color={kiosco ? 'cyan' : 'default'} style={{ margin: 0 }}>
                        <WifiOutlined style={{ marginRight: 4 }} />
                        Lector RFID
                    </Tag>
                    <Switch checked={kiosco} onChange={cambiarKiosco} size="small" />
                </div>
                <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir">
                    Salir
                </Button>
            </div>
        </div>
    )

}


export default HeaderSistema
