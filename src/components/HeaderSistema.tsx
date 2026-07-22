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
            <div className="home-header-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/sistema')}>
                <Logo />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: kiosco ? '#E0F2F1' : '#F5F7FA', padding: '6px 12px', borderRadius: 10 }}>
                    <Tag color={kiosco ? 'cyan' : 'default'} style={{ margin: 0 }}>
                        <WifiOutlined style={{ marginRight: 4 }} />
                        Lector RFID
                    </Tag>
                    <Switch checked={kiosco} onChange={cambiarKiosco} size="small" />
                </div>
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
                <Button onClick={handleLogout} icon={<LogoutOutlined />} className="btn-salir" style={{ marginLeft: 'auto' }}>
                    Salir
                </Button>
            </div>
        </div>
    )

}


export default HeaderSistema