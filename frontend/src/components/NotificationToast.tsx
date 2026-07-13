interface Props { mensaje: string; tipo: 'exito' | 'error' | 'alerta' }
const ICONS = { exito: '✓', error: '✕', alerta: '⚠' }

export default function NotificationToast({ mensaje, tipo }: Props) {
  return (
    <div className={`toast toast-${tipo}`}>
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{ICONS[tipo]}</span>
      <span>{mensaje}</span>
    </div>
  )
}