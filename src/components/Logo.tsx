interface Props {
  size?: 'small' | 'large'
  dark?: boolean
}

function Logo({ size = 'small' }: Props) {
  const isLarge = size === 'large'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLarge ? 16 : 10 }}>
      <img
        src="/logo-sudamericano.png"
        alt="Instituto de Tecnologías Sudamericano"
        style={{
          height: isLarge ? 56 : 38,
          width: 'auto',
          objectFit: 'contain',
        }}
      />
      <div>
        <div style={{
          fontWeight: 800,
          fontSize: isLarge ? 14 : 11,
          color: '#5eead4',
          lineHeight: 1.1,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}>
          Biblioteca Daniel Perazzo
        </div>
      </div>
    </div>
  )
}

export default Logo