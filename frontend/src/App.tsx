import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from './api/client';
import './index.css'; // Vinculación obligatoria del nuevo motor de diseño

interface Usuario {
  id: number;
  nombre: string;
  rol: 'SUPERVISOR' | 'GUARDIA';
  email: string;
}

interface Tarea {
  id: number;
  descripcion: string;
  zona: string;
  prioridad: 'NORMAL' | 'URGENTE';
  estado: 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';
  evidencia: string | null;
  fotoUrl: string | null;
  observacion: string | null;
  guardia?: Usuario;
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Supervisor
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaZona, setNuevaZona] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [guardiaAsignadoId, setGuardiaAsignadoId] = useState('');
  const [obsSupervisor, setObsSupervisor] = useState<{ [key: number]: string }>({});

  // Guardia
  const [comentarioGuardia, setComentarioGuardia] = useState<{ [key: number]: string }>({});
  const [imagenBase64, setImagenBase64] = useState<{ [key: number]: string }>({});
  const fileInputRef = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Feedback Interno
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'alerta' } | null>(null);

  const mostrarNotificacion = (mensaje: string, tipo: 'exito' | 'error' | 'alerta' = 'exito') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const cargarDatosSistema = useCallback(async () => {
    try {
      const resTareas = await apiClient.get('/tareas');
      setTareas(resTareas.data);
      const resGuardias = await apiClient.get('/guardias');
      setGuardias(resGuardias.data);
    } catch (err) {
      console.error('Sincronización interrumpida.');
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarDatosSistema();
      const intervalo = setInterval(cargarDatosSistema, 4000);
      return () => clearInterval(intervalo);
    }
  }, [usuario, cargarDatosSistema]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await apiClient.post('/login', { email: loginEmail, contrasena: loginPassword });
      setUsuario({ id: res.data.id, nombre: res.data.nombre, email: res.data.email, rol: res.data.role });
      mostrarNotificacion('Credenciales verificadas. Inicializando consola.');
    } catch (err) {
      setLoginError('Error de autenticación. Verifique las credenciales del operador.');
    }
  };

  const crearOrdenTrabajo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaZona || !nuevaDesc || !guardiaAsignadoId || !usuario) return;
    try {
      await apiClient.post('/tareas', {
        zona: nuevaZona,
        descripcion: nuevaDesc,
        prioridad: nuevaPrioridad,
        guardiaId: Number(guardiaAsignadoId),
        supervisorId: usuario.id
      });
      setNuevaZona(''); 
      setNuevaDesc(''); 
      mostrarNotificacion('Misión perimetral transmitida con éxito.');
      cargarDatosSistema();
    } catch (err) { 
      mostrarNotificacion('Error de enlace de red al despachar.', 'error'); 
    }
  };

  const dictaminarTarea = async (tareaId: number, estado: 'APROBADA' | 'RECHAZADA') => {
    try {
      await apiClient.put(`/tareas/${tareaId}/validar`, {
        estado,
        observacion: obsSupervisor[tareaId] || (estado === 'APROBADA' ? 'Validación de conformidad exitosa.' : 'Inspección rechazada por inconsistencias.')
      });
      mostrarNotificacion(estado === 'APROBADA' ? 'Registro aprobado y archivado.' : 'Misión devuelta a terreno.');
      cargarDatosSistema();
    } catch (err) { 
      mostrarNotificacion('Fallo al registrar dictamen.', 'error'); 
    }
  };

  const clausurarTurnoOperativo = async () => {
    if (!window.confirm('¿Confirmar clausura de la jornada operativa?')) return;
    try {
      await apiClient.post('/turnos/cerrar');
      mostrarNotificacion('Jornada finalizada de forma segura. PDF compilado.');
      cargarDatosSistema();
    } catch (err) {
      mostrarNotificacion('Error crítico al cerrar jornada.', 'error');
    }
  };

  const capturarFotoNativa = (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenBase64(prev => ({ ...prev, [tareaId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const enviarEvidenciaDesdeWeb = async (tareaId: number) => {
    const comentario = comentarioGuardia[tareaId];
    const foto = imagenBase64[tareaId];
    if (!comentario) return mostrarNotificacion('Bitácora técnica obligatoria.', 'alerta');
    if (!foto) return mostrarNotificacion('Evidencia fotográfica obligatoria.', 'alerta');

    try {
      await apiClient.post('/evidencias', { tareaId, comentario, fotoBase64: foto });
      setComentarioGuardia(p => ({ ...p, [tareaId]: '' }));
      setImagenBase64(p => ({ ...p, [tareaId]: '' }));
      mostrarNotificacion('Reporte transmitido a la Central de Operaciones.');
      cargarDatosSistema();
    } catch (err) { 
      mostrarNotificacion('Error en el canal de transmisión.', 'error'); 
    }
  };

  const renderEstadoBadge = (estado: string) => {
    const configuraciones: { [key: string]: { texto: string; fondo: string; color: string } } = {
      PENDIENTE: { texto: 'PENDIENTE DE INSPECCIÓN', fondo: 'rgba(234, 179, 8, 0.1)', color: '#eab308' },
      EN_REVISION: { texto: 'EN AUDITORÍA DE CENTRAL', fondo: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      APROBADA: { texto: 'CONFORME', fondo: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
      RECHAZADA: { texto: 'NO CONFORME - REASIGNADA', fondo: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
    };
    const badge = configuraciones[estado] || { texto: estado, fondo: '#27272a', color: '#a1a1aa' };
    return (
      <span style={{ backgroundColor: badge.fondo, color: badge.color, padding: '4px 10px', fontSize: '10px', fontWeight: 700, borderRadius: '4px', letterSpacing: '0.5px' }}>
        {badge.texto}
      </span>
    );
  };

  // VISTA 1: LOGIN (CONSOLA DE CONTROL)
  if (!usuario) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b' }}>
        <form onSubmit={handleLogin} style={{ background: '#121214', padding: '45px', borderRadius: '6px', width: '360px', border: '1px solid #232326', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ color: '#eab308', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>S.I. PROTECTION</div>
            <h2 style={{ margin: 0, color: '#f4f4f5', fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px' }}>SISTEMA DE AUDITORÍA PERIMETRAL</h2>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>CORREO CORPORATIVO</label>
            <input type="email" placeholder="operador@sipprotection.cl" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="form-control-sip" />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>CREDENCIAL DE ACCESO</label>
            <input type="password" placeholder="••••••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="form-control-sip" />
          </div>
          {loginError && <p style={{ color: '#f87171', fontSize: '12px', margin: '-14px 0 18px 0', lineHeight: '1.4' }}>{loginError}</p>}
          <button type="submit" className="btn-primary-sip">AUTENTICAR SISTEMA</button>
        </form>
      </div>
    );
  }

  // VISTA GENERAL DEL DASHBOARD MODERNO
  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', backgroundColor: '#09090b', minHeight: '100vh', color: '#f4f4f5' }}>
      
      {/* Sistema Toast Notificación */}
      {notificacion && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', padding: '14px 24px', borderRadius: '4px', color: '#000000', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s ease', backgroundColor: notificacion.tipo === 'error' ? '#f87171' : notificacion.tipo === 'alerta' ? '#fbbf24' : '#34d399' }}>
          {notificacion.mensaje.toUpperCase()}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #232326', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px', color: '#ffffff' }}>S.I. PROTECTION — DEPARTAMENTO DE OPERACIONES</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terminal Activo: {usuario.nombre} | ROL: {usuario.rol}</p>
        </div>
        <button onClick={() => setUsuario(null)} style={{ padding: '8px 16px', background: '#161619', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>DESCONECTAR TERMINAL</button>
      </header>

      {/* INTERFAZ DEL SUPERVISOR (DASHBOARD GENERAL DE ALTA DENSIDAD) */}
      {usuario.rol === 'SUPERVISOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
          <div>
            <div style={{ background: '#121214', padding: '24px', borderRadius: '6px', border: '1px solid #232326', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '11px', color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Emisión de Orden de Despacho</h3>
              <form onSubmit={crearOrdenTrabajo}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>ÁREA O CRUCE DE PERÍMETRO</label>
                  <input type="text" placeholder="Ej: Sector C - Acceso de Carga" value={nuevaZona} onChange={e => setNuevaZona(e.target.value)} required className="form-control-sip" />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>DIRECTRICES TÉCNICAS DE INSPECCIÓN</label>
                  <textarea placeholder="Detalle el protocolo específico a evaluar..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} required className="form-control-sip" style={{ height: '90px', resize: 'none', fontFamily: 'inherit' }}/>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>NIVEL DE PRIORIDAD</label>
                  <select value={nuevaPrioridad} onChange={e => setNuevaPrioridad(e.target.value as any)} className="form-control-sip">
                    <option value="NORMAL">NIVEL 1: PROCEDIMIENTO ESTÁNDAR</option>
                    <option value="URGENTE">NIVEL 2: REQUERIMIENTO CRÍTICO</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>OPERADOR DE SEGURIDAD ASIGNADO</label>
                  <select value={guardiaAsignadoId} onChange={e => setGuardiaAsignadoId(e.target.value)} required className="form-control-sip">
                    <option value="">Seleccione personal disponible...</option>
                    {guardias.map(g => <option key={g.id} value={g.id}>{g.nombre.toUpperCase()}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary-sip">DESPACHAR ORDEN DE TRABAJO</button>
              </form>
            </div>
            <button onClick={clausurarTurnoOperativo} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.5px', transition: 'all 0.2s' }}>CONSOLIDAR BITÁCORA Y CERRAR JORNADA</button>
          </div>

          <div>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: 700, color: '#71717a', letterSpacing: '0.5px' }}>MONITOREO DE BITÁCORA GENERAL</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tareas.map(t => (
                <div key={t.id} className={`card-sip ${t.prioridad === 'URGENTE' ? 'card-urgent-sip' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', color: '#ffffff' }}>
                      {t.zona.toUpperCase()} <span className="code-ref">REF-{t.id}</span>
                    </span>
                    {renderEstadoBadge(t.estado)}
                  </div>
                  <p style={{ fontSize: '13px', color: '#d4d4d8', margin: '0 0 16px 0', lineHeight: '1.5' }}>{t.descripcion}</p>
                  
                  <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span>OPERADOR: <strong style={{ color: '#a1a1aa' }}>{t.guardia?.nombre}</strong></span>
                    <span>PRIORIDAD: <strong style={{ color: t.prioridad === 'URGENTE' ? '#ef4444' : '#a1a1aa' }}>{t.prioridad}</strong></span>
                  </div>

                  {t.evidencia && (
                    <div style={{ marginTop: '16px', background: '#09090b', padding: '16px', borderRadius: '4px', border: '1px solid #232326' }}>
                      <span style={{ fontSize: '10px', color: '#eab308', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>DECLARACIÓN ADJUNTADA DE TERRENO:</span>
                      <p style={{ margin: '0 0 14px 0', fontSize: '13px', fontStyle: 'italic', color: '#e4e4e7', lineHeight: '1.4' }}>"{t.evidencia}"</p>
                      {t.fotoUrl && <img src={t.fotoUrl} alt="Registro Perimetral" style={{ maxWidth: '280px', borderRadius: '4px', border: '1px solid #232326', display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />}
                    </div>
                  )}

                  {t.estado === 'EN_REVISION' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #232326' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>OBSERVACIÓN DE EVALUACIÓN DE CENTRAL</label>
                      <input type="text" placeholder="Ingrese las causales técnicas antes de dictaminar..." value={obsSupervisor[t.id] || ''} onChange={e => setObsSupervisor({ ...obsSupervisor, [t.id]: e.target.value })} className="form-control-sip" style={{ marginBottom: '12px' }} />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => dictaminarTarea(t.id, 'APROBADA')} style={{ padding: '8px 16px', backgroundColor: '#22c55e', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }}>APROBAR REGISTRO</button>
                        <button onClick={() => dictaminarTarea(t.id, 'RECHAZADA')} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }}>DEVOLVER A TERRENO</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERFAZ DEL GUARDIA (DISEÑO MÓVIL ESTRICTO / TERMINAL TÁCTICO) */}
      {usuario.rol === 'GUARDIA' && (
        <div style={{ maxWidth: '460px', margin: '0 auto', background: '#121214', padding: '24px', borderRadius: '6px', border: '1px solid #232326', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '11px', textAlign: 'center', color: '#eab308', letterSpacing: '1px', fontWeight: 700 }}>TERMINAL OPERATIVO DE CONEXIÓN</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tareas.filter(t => t.guardia?.id === usuario.id).map(t => (
              <div key={t.id} style={{ background: '#09090b', padding: '16px', borderRadius: '4px', border: '1px solid #232326' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>{t.zona.toUpperCase()}</span>
                  <span className="code-ref">ID-{t.id}</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#d4d4d8', lineHeight: '1.4' }}>{t.descripcion}</p>

                {t.observacion && t.estado === 'PENDIENTE' && (
                  <div style={{ marginBottom: '14px', padding: '12px', background: 'rgba(239, 68, 68, 0.04)', borderLeft: '3px solid #ef4444', borderRadius: '2px', fontSize: '12px' }}>
                    <strong style={{ color: '#ef4444', display: 'block', fontSize: '10px', marginBottom: '4px', letterSpacing: '0.5px' }}>RECHAZADO POR CENTRAL:</strong>
                    <span style={{ color: '#f4f4f5', fontStyle: 'italic', lineHeight: '1.4' }}>{t.observacion}</span>
                  </div>
                )}

                {t.estado === 'PENDIENTE' ? (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#71717a', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>REPORTE ESCRITO DE HALLAZGOS</label>
                    <textarea placeholder="Ingrese la glosa técnica según el protocolo..." value={comentarioGuardia[t.id] || ''} onChange={e => setComentarioGuardia({ ...comentarioGuardia, [t.id]: e.target.value })} className="form-control-sip" style={{ height: '70px', resize: 'none', marginBottom: '12px', fontFamily: 'inherit' }} />
                    
                    <input type="file" accept="image/*" ref={el => fileInputRef.current[t.id] = el} onChange={e => capturarFotoNativa(e, t.id)} style={{ display: 'none' }} />
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <button onClick={() => fileInputRef.current[t.id]?.click()} style={{ flex: 1, padding: '10px', background: '#161619', color: '#ffffff', border: '1px solid #27272a', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                        {imagenBase64[t.id] ? '✓ ARCHIVO ADJUNTADO' : 'SELECCIONAR REGISTRO FOTOGRÁFICO'}
                      </button>
                      {imagenBase64[t.id] && (
                        <button onClick={() => setImagenBase64(p => ({ ...p, [t.id]: '' }))} style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>BORRAR</button>
                      )}
                    </div>

                    <button onClick={() => enviarEvidenciaDesdeWeb(t.id)} className="btn-primary-sip">TRANSMITIR REPORTE DE INSPECCIÓN</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', background: '#161619', borderRadius: '4px', fontSize: '11px', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.5px', border: '1px solid #232326' }}>
                    {t.estado === 'EN_REVISION' ? 'TRANSMISIÓN ENVIADA — EVALUACIÓN EN CURSO' : 'REGISTRO APROBADO Y ARCHIVADO'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}