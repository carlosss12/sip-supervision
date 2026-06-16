interface Props{
  mensaje:string;
  tipo:'exito'|'error'|'alerta';
}

export default function NotificationToast({
  mensaje,
  tipo
}:Props){

  const color =
    tipo === 'error'
      ? '#ef4444'
      : tipo === 'alerta'
      ? '#f59e0b'
      : '#22c55e';

  return(
    <div
      style={{
        position:'fixed',
        top:'20px',
        right:'20px',
        background:color,
        color:'white',
        padding:'14px 20px',
        borderRadius:'10px',
        zIndex:999
      }}
    >
      {mensaje}
    </div>
  );
}