import React from 'react';
import { IconoRutina, IconoAlerta, IconoCritico } from './Iconos';

export const Estadisticas = ({ stats }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div style={{ background: '#18181b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a' }}>
        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600' }}>TOTAL REGISTROS</div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fafafa', marginTop: '4px' }}>{stats.total || 0}</div>
      </div>
      
      <div style={{ background: '#18181b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a', borderLeft: '3px solid #22c55e' }}>
        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconoRutina /> RUTINA
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#22c55e', marginTop: '4px' }}>{stats.rutina || 0}</div>
      </div>

      <div style={{ background: '#18181b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a', borderLeft: '3px solid #eab308' }}>
        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconoAlerta /> ALERTAS
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#eab308', marginTop: '4px' }}>{stats.alerta || 0}</div>
      </div>

      <div style={{ background: '#18181b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a', borderLeft: '3px solid #ef4444' }}>
        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconoCritico /> CRÍTICOS
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ef4444', marginTop: '4px' }}>{stats.critico || 0}</div>
      </div>
    </div>
  );
};