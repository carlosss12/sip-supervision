import React, { useState, useEffect, useCallback } from 'react';
import apiClient from './api/client';

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

  // Estados del Supervisor
  const [guardias, setGuardias] = useState<Usuario[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaZona, setNuevaZona] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [guardiaAsignadoId, setGuardiaAsignadoId] = useState('');
  const [obsSupervisor, setObsSupervisor] = useState<{ [key: number]: string }>({});

  // Estados del Guardia (Simulador Web)
  const [comentarioGuardia, setComentarioGuardia] = useState<{ [key: number]: string }>({});

  const cargarDatosSistema = useCallback(async () => {
    try {
      const resTareas = await apiClient.get('/tareas');
      setTareas(resTareas.data);
      const resGuardias = await apiClient.get('/guardias');
      setGuardias(resGuardias.data);
    } catch (err) {
      console.error('Error en sincronización táctica:', err);
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
      const res = await apiClient.post('/login', { 
        email: loginEmail, 
        contrasena: loginPassword 
      });
      setUsuario({
        id: res.data.id,
        nombre: res.data.nombre,
        email: res.data.email,
        rol: res.data.role
      });
    } catch (err) {
      setLoginError('Acceso denegado. Credenciales no corporativas o contraseña incorrecta.');
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
      cargarDatosSistema();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fallo al transmitir orden.');
    }
  };

  const dictaminarTarea = async (tareaId: number, estado: 'APROBADA' | 'RECHAZADA') => {
    try {
      await apiClient.put(`/tareas/${tareaId}/validar`, {
        estado,
        observacion: obsSupervisor[tareaId] || 'Ronda validada conforme por la Central de Operaciones.'
      });
      cargarDatosSistema();
    } catch (err) {
      alert('Error en dictamen de auditoría.');
    }
  };

  const clausurarTurnoOperativo = async () => {
    if (!window.confirm('¿Confirmar clausura de turno? Esta acción bloqueará los registros actuales y compilará el PDF de auditoría de forma inmutable.')) return;
    try {
      const res = await apiClient.post('/turnos/cerrar');
      alert(`TURNO CLAUSURADO\n${res.data.message}`);
      cargarDatosSistema();
    } catch (err) {
      alert('Error crítico durante el cierre de turno.');
    }
  };

  const enviarEvidenciaDesdeWeb = async (tareaId: number) => {
    const comentario = comentarioGuardia[tareaId];
    if (!comentario) return alert('Debe registrar un informe descriptivo del perímetro.');
    try {
      await apiClient.post('/evidencias', {
        tareaId,
        comentario,
        fotoUrl: null // Foto deshabilitada temporalmente para el hito de avance web
      });
      cargarDatosSistema();
    } catch (err) {
      alert('Error al transmitir informe de evidencia.');
    }
  };

  if (!usuario) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b' }}>
        <form onSubmit={handleLogin} style={{ background: '#121214', padding: '40px', borderRadius: '8px', width: '380px', border: '1px solid #27272a', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.7)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#facc15', color: '#000', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px', marginBottom: '10px', letterSpacing: '1.5px' }}>
              S.I. PROTECTION
            </div>
            <h2 style={{ margin: 0, color: '#f4f4f5', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px' }}>Terminal de Acceso</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#71717a' }}>Sistema de Control e Integridad Operativa</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#a1a1aa', textTransform: 'uppercase' }}>Correo Institucional:</label>
            <input 
              type="email" 
              placeholder="usuario@sipprotection.cl"
              value={loginEmail} 
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #27272a', borderRadius: '6px', backgroundColor: '#18181b', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#a1a1aa', textTransform: 'uppercase' }}>Contraseña de Seguridad:</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #27272a', borderRadius: '6px', backgroundColor: '#18181b', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>
          
          {loginError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '10px', borderRadius: '6px', margin: '0 0 20px 0' }}>
              <p style={{ color: '#f87171', fontSize: '12px', margin: 0, textAlign: 'center' }}>{loginError}</p>
            </div>
          )}
          
          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Autenticar e Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '25px', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#09090b', minHeight: '100vh', color: '#f4f4f5' }}>
      
      {/* HEADER CORPORATIVO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>S.I. PROTECTION</h1>
            <span style={{ backgroundColor: '#27272a', color: '#facc15', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid #3f3f46' }}>SISTEMA DE MONITOREO</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#71717a' }}>
            Estación de Trabajo: <strong style={{ color: '#e4e4e7' }}>{usuario.nombre}</strong> <span style={{ color: '#52525b' }}>|</span> Rol: <span style={{ color: '#facc15', fontWeight: '600' }}>{usuario.rol}</span>
          </p>
        </div>
        <button onClick={() => setUsuario(null)} style={{ padding: '10px 18px', backgroundColor: '#18181b', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          Desconectar Sistema
        </button>
      </header>

      {/* ROL: SUPERVISOR CENTRAL */}
      {usuario.rol === 'SUPERVISOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '30px' }}>
          <div>
            <div style={{ background: '#121214', padding: '25px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #facc15', paddingBottom: '8px' }}>Emitir Orden de Despliegue</h3>
              
              <form onSubmit={crearOrdenTrabajo}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a1a1aa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Perímetro / Zona Objetivo:</label>
                  <input type="text" placeholder="Ej: Bodega Central, Patio de Racks" value={nuevaZona} onChange={e => setNuevaZona(e.target.value)} required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '14px' }}/>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a1a1aa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Instrucciones Críticas de Seguridad:</label>
                  <textarea placeholder="Escriba los puntos específicos a inspeccionar..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '14px', height: '90px', resize: 'none', fontFamily: 'inherit' }}/>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#a1a1aa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Prioridad Táctica:</label>
                    <select value={nuevaPrioridad} onChange={e => setNuevaPrioridad(e.target.value as any)} style={{ width: '100%', padding: '10px', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
                      <option value="NORMAL">NORMAL</option>
                      <option value="URGENTE">URGENTE</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#a1a1aa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Asignar Operador:</label>
                    <select value={guardiaAsignadoId} onChange={e => setGuardiaAsignadoId(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
                      <option value="">Seleccionar...</option>
                      {guardias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Transmitir Orden de Trabajo
                </button>
              </form>
            </div>

            <div style={{ background: '#121214', padding: '25px', borderRadius: '8px', border: '1px solid #27272a' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fin de Jornada Operativa</h3>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 20px 0', lineHeight: '1.5' }}>Al presionar este botón se congelará la bitácora del turno, liberando de forma automatizada un informe consolidado en formato PDF inmutable.</p>
              <button onClick={clausurarTurnoOperativo} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                Cerrar Turno y Exportar Reporte PDF
              </button>
            </div>
          </div>

          {/* BITÁCORA DEL SUPERVISOR */}
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', fontWeight: '600' }}>Bitácora de Eventos Activos</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {tareas.length === 0 ? (
                <div style={{ border: '1px dashed #27272a', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#71717a' }}>
                  No hay misiones de control despachadas en este turno.
                </div>
              ) : (
                tareas.map(t => {
                  const colorEstado = t.estado === 'APROBADA' ? '#10b981' : t.estado === 'EN_REVISION' ? '#facc15' : t.estado === 'RECHAZADA' ? '#ef4444' : '#a1a1aa';
                  const bgPrioridad = t.prioridad === 'URGENTE' ? 'rgba(239,68,68,0.05)' : 'transparent';
                  const borderPrioridad = t.prioridad === 'URGENTE' ? '1px solid #ef4444' : '1px solid #27272a';

                  return (
                    <div key={t.id} style={{ background: '#121214', padding: '20px', borderRadius: '8px', border: borderPrioridad, backgroundColor: bgPrioridad }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '600' }}>{t.zona}</h4>
                            <span style={{ fontSize: '10px', color: '#71717a', backgroundColor: '#18181b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #27272a' }}>ID: #{t.id}</span>
                            {t.prioridad === 'URGENTE' && <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>ALERTA CRÍTICA</span>}
                          </div>
                          <p style={{ margin: '8px 0', fontSize: '14px', color: '#d4d4d8', lineHeight: '1.5' }}>{t.descripcion}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>Fuerza Desplegada: <strong style={{ color: '#a1a1aa' }}>{t.guardia?.nombre || 'Sin asignar'}</strong></p>
                        </div>
                        
                        <span style={{ fontSize: '11px', fontWeight: '700', color: colorEstado, border: `1px solid ${colorEstado}`, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          {t.estado === 'EN_REVISION' ? 'EN REVISIÓN' : t.estado}
                        </span>
                      </div>

                      {/* INFORME DE EVIDENCIA EN TEXTO */}
                      {t.evidencia && (
                        <div style={{ marginTop: '15px', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', padding: '15px' }}>
                          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Evidencia Digital Transmitida:</span>
                          <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', fontStyle: 'italic' }}>"{t.evidencia}"</p>
                        </div>
                      )}

                      {/* PANEL DE VALIDACIÓN */}
                      {t.estado === 'EN_REVISION' && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #27272a' }}>
                          <input 
                            type="text" 
                            placeholder="Escriba un veredicto u observación de la validación..." 
                            value={obsSupervisor[t.id] || ''} 
                            onChange={e => setObsSupervisor({ ...obsSupervisor, [t.id]: e.target.value })}
                            style={{ width: '100%', padding: '10px', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', fontSize: '13px' }}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => dictaminarTarea(t.id, 'APROBADA')} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Aprobar y Registrar</button>
                            <button onClick={() => dictaminarTarea(t.id, 'RECHAZADA')} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Rechazar Falla</button>
                          </div>
                        </div>
                      )}

                      {/* NOTAS DE AUDITORÍA */}
                      {t.observacion && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', fontSize: '12px', color: '#10b981' }}>
                          <strong>Resolución de Central:</strong> {t.observacion}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROL: GUARDIA (SIMULADOR DE TERMINAL MÓVIL) */}
      {usuario.rol === 'GUARDIA' && (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ background: '#18181b', border: '1px solid #facc15', padding: '15px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#facc15', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              TERMINAL PORTÁTIL DE SIMULACIÓN MÓVIL
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#a1a1aa' }}>Use este entorno si está evaluando el flujo sin el celular físico conectado.</p>
          </div>
          
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Rondas y Asignaciones Vigentes</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {tareas.filter(t => t.guardia?.id === usuario.id).length === 0 ? (
              <div style={{ border: '1px dashed #27272a', padding: '50px', borderRadius: '8px', textAlign: 'center', color: '#71717a' }}>
                No registra órdenes de patrullaje pendientes a su nombre.
              </div>
            ) : (
              tareas.filter(t => t.guardia?.id === usuario.id).map(t => (
                <div key={t.id} style={{ background: '#121214', padding: '25px', borderRadius: '8px', border: t.prioridad === 'URGENTE' ? '1px solid #ef4444' : '1px solid #27272a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 'bold' }}>SECTOR ASIGNADO</span>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#09090b', color: '#facc15', border: '1px solid #27272a', fontWeight: 'bold' }}>{t.estado}</span>
                  </div>
                  
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff', fontWeight: '600' }}>{t.zona}</h4>
                  <p style={{ fontSize: '14px', color: '#d4d4d8', margin: '0 0 20px 0', lineHeight: '1.5', background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #18181b' }}>
                    <strong style={{ color: '#facc15', display: 'block', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>Instrucción de la Central:</strong>
                    {t.descripcion}
                  </p>
                  
                  {t.estado === 'PENDIENTE' && (
                    <div style={{ background: '#18181b', padding: '15px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '6px' }}>Bitácora de Cumplimiento (Evidencia escrita):</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Candados verificados conforme. Sin novedades en el sector." 
                        value={comentarioGuardia[t.id] || ''} 
                        onChange={e => setComentarioGuardia({ ...comentarioGuardia, [t.id]: e.target.value })}
                        style={{ width: '100%', padding: '12px', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', boxSizing: 'border-box', marginBottom: '12px', fontSize: '14px' }}
                      />
                      <button onClick={() => enviarEvidenciaDesdeWeb(t.id)} style={{ width: '100%', padding: '12px', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase' }}>
                        Transmitir Evidencia de Terreno
                      </button>
                    </div>
                  )}

                  {t.observacion && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#09090b', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid #facc15' }}>
                      <strong>Feedback Central de Mando:</strong> <span style={{ color: '#a1a1aa' }}>{t.observacion}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}