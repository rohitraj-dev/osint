import React from 'react';

const Header = ({ aircraftCount, vesselCount, anomalyCount }) => {
  const headerStyle = {
    width: '100%',
    height: '56px',
    flexShrink: 0,
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 1000,
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const blueCircleStyle = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
  };

  const titleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    letterSpacing: '0.5px',
  };

  const liveBadgeStyle = {
    color: 'var(--ok)',
    fontSize: '11px',
    fontWeight: 'bold',
    marginLeft: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  };

  const chipStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const chipNumberStyle = (color) => ({
    fontSize: '16px',
    fontWeight: 'bold',
    color: color,
    lineHeight: '1',
  });

  const chipLabelStyle = {
    fontSize: '10px',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    marginTop: '2px',
  };

  return (
    <header style={headerStyle}>
      <div style={leftSectionStyle}>
        <div style={blueCircleStyle}></div>
        <div style={titleContainerStyle}>
          <span style={{ fontWeight: 'bold' }}>OSINT</span>
          <span style={{ fontWeight: 'normal', color: 'var(--text-sec)' }}>DOMAIN AWARENESS</span>
        </div>
        <div style={liveBadgeStyle}>
          <span>●</span> LIVE
        </div>
      </div>
      <div style={rightSectionStyle}>
        <div style={chipStyle}>
          <span style={chipNumberStyle('var(--accent)')}>{aircraftCount}</span>
          <span style={chipLabelStyle}>Aircraft</span>
        </div>
        <div style={chipStyle}>
          <span style={chipNumberStyle('var(--ok)')}>{vesselCount}</span>
          <span style={chipLabelStyle}>Vessels</span>
        </div>
        <div style={chipStyle}>
          <span style={chipNumberStyle('var(--danger)')}>{anomalyCount}</span>
          <span style={chipLabelStyle}>Anomalies</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
