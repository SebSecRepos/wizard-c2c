import React from 'react';

export const TopBar = ({ data }) => {
  const {
    impl_mac = [],
    group = '',
    public_ip = '',
    local_ip = [],
    operating_system = '',
    id = '',
  } = data;

  const containerStyle = {
    height: '150px',
    width: '96%',
    backgroundColor: '#0f0f0f',
    color: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    overflowY: 'scroll',
    gap: '40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
  };

  const sectionStyle = {
    minWidth: '150px',
    padding:'10px',
    borderRadius:'5px',
  };

  const labelStyle = {
    fontSize: '13px',
    color: '#888',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const valueStyle = {
    fontSize: '15px',
    fontWeight: '500',
    color: '#f5f5f5',
    wordWrap: 'break-word',
  };

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  overflowX: 'auto', // scroll o auto funciona igual aquí
  whiteSpace: 'nowrap', // fuerza el contenido a no hacer saltos de línea
  display: 'block',
  width: '150px', // o el ancho que desees
  maxHeight: '40px', // opcional: si quieres limitar también verticalmente
};

  const listItemStyle = {
    backgroundColor: '#1a1a1a',
    marginBottom: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#ccc',
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={labelStyle}>Grupo</div>
        <div style={valueStyle}>{group || 'No definido'}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>IP Pública</div>
        <div style={valueStyle}>{public_ip || 'No disponible'}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>IPs Locales</div>
        <ul style={listStyle}>
          {local_ip.length > 0 ? (
            local_ip.map((ip, idx) => (
              <li key={idx} style={listItemStyle}>{ip}</li>
            ))
          ) : (
            <li style={listItemStyle}>Sin datos</li>
          )}
        </ul>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Sistema Operativo</div>
        <div style={valueStyle}>{operating_system || 'No especificado'}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>ID</div>
        <div style={valueStyle}>{id || 'No disponible'}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Macs</div>
        <ul style={listStyle}>
          {impl_mac.length > 0 ? (
            impl_mac.map((m, idx) => (
              <li key={idx} style={listItemStyle}>{m}</li>
            ))
          ) : (
            <li style={listItemStyle}>Sin datos</li>
          )}
        </ul>
      </div>
    </div>
  );
};

