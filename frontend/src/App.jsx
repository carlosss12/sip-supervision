import React, { useState, useEffect } from 'react';
import { IconoEscudo, IconoCamara, IconoUbicacion, IconoRutina, IconoAlerta, IconoCritico, IconoEnviar } from './components/Iconos';
import { Estadisticas } from './components/Estadisticas';

function App() {
  const [actividades, setActividades] = useState([]);
  const [stats, setStats] = useState({});
  const [filtro, setFiltro] = useState('TODOS');
  
  const [guardia, setGuardia] = useState('');
  const [instalacion, setInstalacion] = useState('');
  const [novedad, setNovedad] = useState('');
  const [tipo, setTipo] = useState('RUTINA');
  
  const [conexion, setConexion] = useState(true);

  const cargarDatos = () => {
    fetch('http://localhost:4000/api/actividades/stats')
      .then(res => res.json())
      .then(data => { setStats(data); setConexion(true); })
      .catch(() => setConexion(false));

    fetch(`http://localhost:4000/api/actividades?tipo=${filtro}`)
      .then(res => res.json())
      .then(data => setActividades(data))
      .catch(() => setConexion(false));
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 3000);
    return () => clearInterval(intervalo);
  }, [filtro]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!novedad.trim()) return;

    fetch('http://localhost:4000/api/actividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardia, instalacion, novedad, tipo })
    })
      .then(() => {
        setNovedad('');
        cargarDatos();
      })
      .catch(() => alert('Error de comunicación con el servidor'));
  };

  // NUEVA FUNCIÓN BÁSICA: Eliminar / Resolver registro en vivo
  const handleEliminar = (id) => {
    fetch(`http://localhost:4000/api/actividades/${id}`, { method: 'DELETE' })
      .then(() => cargarDatos()) // Recargamos la lista y estadísticas al instante
      .catch(() => alert('Error al intentar resolver el registro'));
  };

  const renderIconoTipo = (gravedad) => {
    switch(gravedad) {
      case 'ALERTA': return <IconoAlerta />;
      case 'CRÍTICO': return <IconoCritico />;
      default: return <IconoRutina />;
    }
  };

  return (
    <>
      <style>{`
        body { margin: 0; background-color: #09090b; color: #fafafa; font-family: system-ui, sans-serif; }
        input, select, textarea { outline: none; border: 1px solid #27272a; background: #09090b; color: #fff; padding: 10px; border-radius: 6px; width: 100%; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #eab308; }
        .btn-filtro { background: #18181b; border: 1px solid #27272a; color: #a1a1aa; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; }
        .btn-filtro.activo { background: #eab308; color: #000; border-color: #eab308; }
        .btn-resolver { background: transparent; border: 1px solid #3f3f46; color: #a1a1aa; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; transition: 0.2s; }
        .btn-resolver:hover { background: #22c55e; color: #000; border-color: #22c55e; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <header style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconoEscudo />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>S.I. PROTECTION</h1>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Plataforma de Supervisión CCTV</span>
            </div>
          </div>

        </header>

        <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          <Estadisticas stats={stats} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            <section style={{ background: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a', height: 'fit-content' }}>
              <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconoCamara /> Validar Actividad
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px' }}>GUARDIA / OFICIAL</label>
                  <input type="text" placeholder="Ej. Sup. Luis Pérez" value={guardia} onChange={e => setGuardia(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px' }}>CÁMARA / SECTOR</label>
                  <input type="text" placeholder="Ej. Cam 02 - Bodega" value={instalacion} onChange={e => setInstalacion(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px' }}>GRAVEDAD</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="RUTINA">RUTINA (Sin Novedades)</option>
                    <option value="ALERTA">ALERTA (Observación)</option>
                    <option value="CRÍTICO">CRÍTICO (Acción Inmediata)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '4px' }}>DETALLE OPERATIVO</label>
                  <textarea rows="3" placeholder="Describa la novedad..." value={novedad} onChange={e => setNovedad(e.target.value)} required />
                </div>

                <button type="submit" style={{ background: '#eab308', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IconoEnviar /> Sincronizar Registro
                </button>
              </form>
            </section>

            <section style={{ background: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Registros del Turno</h2>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['TODOS', 'RUTINA', 'ALERTA', 'CRÍTICO'].map(t => (
                    <button key={t} className={`btn-filtro ${filtro === t ? 'activo' : ''}`} onClick={() => setFiltro(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {actividades.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No hay registros activos.</div>
                ) : (
                  actividades.map(act => (
                    <div key={act.id} style={{ background: '#09090b', padding: '14px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {renderIconoTipo(act.tipo)}
                          <strong style={{ fontSize: '0.85rem' }}>{act.guardia}</strong>
                        </div>
                        
                        {/* BOTÓN BÁSICO PARA RESOLVER/ELIMINAR */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{act.hora}</span>
                          <button className="btn-resolver" onClick={() => handleEliminar(act.id)} title="Marcar como resuelto">
                            ✓ Resuelto
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: '#eab308', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconoUbicacion /> {act.instalacion}
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: '#d4d4d8', margin: 0 }}>{act.novedad}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}

export default App;