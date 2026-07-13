import { IconCheck, IconX, IconAlert } from './Icons'

interface Props { mensaje: string; tipo: 'exito' | 'error' | 'alerta' }

const ICON = {
  exito:  <IconCheck size={14} color="var(--green)" />,
  error:  <IconX    size={14} color="var(--red)" />,
  alerta: <IconAlert size={14} color="var(--primary)" />,
}

export default function NotificationToast({ mensaje, tipo }: Props) {
  return (
    <div className={`toast toast-${tipo}`}>
      {ICON[tipo]}
      <span>{mensaje}</span>
    </div>
  )
}