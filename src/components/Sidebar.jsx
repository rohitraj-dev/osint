import React from 'react';

const Sidebar = ({ layerStates, onToggleLayer }) => {
  const sidebarStyle = {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    backgroundColor: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    color: 'var(--text-pri)',
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const sectionTitleStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px'
  };

  const togglePillStyle = (isOn) => ({
    width: '32px',
    height: '16px',
    borderRadius: '8px',
    backgroundColor: isOn ? 'var(--accent)' : 'var(--surface-el)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });

  const toggleCircleStyle = (isOn) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute',
    top: '2px',
    left: isOn ? '18px' : '2px',
    transition: 'left 0.2s'
  });

  const sliderContainerStyle = {
    marginBottom: '20px'
  };

  const sliderLabelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '8px'
  };

  const sliderStyle = {
    width: '100%',
    accentColor: 'var(--accent)',
    cursor: 'pointer'
  };

  return (
    <aside style={sidebarStyle}>
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Layers</div>
        
        <div style={rowStyle}>
          <span style={{ color: 'var(--accent)' }}>Aircraft</span>
          <div 
            style={togglePillStyle(layerStates.aircraft)} 
            onClick={() => onToggleLayer('aircraft', !layerStates.aircraft)}
          >
            <div style={toggleCircleStyle(layerStates.aircraft)} />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={{ color: 'var(--ok)' }}>Vessels</span>
          <div 
            style={togglePillStyle(layerStates.vessels)} 
            onClick={() => onToggleLayer('vessels', !layerStates.vessels)}
          >
            <div style={toggleCircleStyle(layerStates.vessels)} />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={{ color: 'var(--danger)' }}>Anomalies</span>
          <div 
            style={togglePillStyle(layerStates.anomalies)} 
            onClick={() => onToggleLayer('anomalies', !layerStates.anomalies)}
          >
            <div style={toggleCircleStyle(layerStates.anomalies)} />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={{ color: 'var(--text-sec)' }}>Satellite</span>
          <div 
            style={togglePillStyle(layerStates.satellite)} 
            onClick={() => onToggleLayer('satellite', !layerStates.satellite)}
          >
            <div style={toggleCircleStyle(layerStates.satellite)} />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={{ color: 'var(--warn)' }}>Zones</span>
          <div 
            style={togglePillStyle(layerStates.zones)} 
            onClick={() => onToggleLayer('zones', !layerStates.zones)}
          >
            <div style={toggleCircleStyle(layerStates.zones)} />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Filter</div>
        
        <div style={sliderContainerStyle}>
          <div style={sliderLabelStyle}>
            <span>Altitude Range</span>
            <span style={{ color: 'var(--text-sec)' }}>0–45k ft</span>
          </div>
          <input type="range" min="0" max="45000" defaultValue="45000" style={sliderStyle} />
        </div>

        <div style={sliderContainerStyle}>
          <div style={sliderLabelStyle}>
            <span>Speed Range</span>
            <span style={{ color: 'var(--text-sec)' }}>0–50 kn</span>
          </div>
          <input type="range" min="0" max="50" defaultValue="50" style={sliderStyle} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
