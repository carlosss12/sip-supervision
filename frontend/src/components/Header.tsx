import { Usuario } from '../types/Usuario';

interface Props{
  usuario:Usuario;
  logout:() => void;
}

export default function Header({
  usuario,
  logout
}:Props){

  return(
    <header className="topbar">

      <div>
        <div className="page-title">
          Centro de Supervisión Operacional
        </div>

        <div className="page-subtitle">
          Usuario conectado: {usuario.nombre}
        </div>
      </div>

      <button
        className="btn-primary-sip"
        onClick={logout}
      >
        Cerrar sesión
      </button>

    </header>
  );
}