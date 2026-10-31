import { useEffect, useState } from 'react';

const Header = ({ aircraftCount, vesselCount, anomalyCount, aircraftLastUpdated }) => {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const updatedText = aircraftLastUpdated && now
    ? `Updated ${Math.max(0, Math.floor((now - aircraftLastUpdated.getTime()) / 1000))}s ago`
    : 'Updated —';

  const headerStyle = {
    width: '100%',
    height: '56px',
    boxSizing: 'border-box',
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
    justifyContent: 'space-between',
    gap: '12px',
    minWidth: 0,
    flex: '1 1 auto',
    marginLeft: '20px',
  };

  const chipStyle = {
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80px',
    padding: '6px 10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg)',
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

  const chipSubtitleStyle = {
    fontSize: '9px',
    color: 'var(--text-dim)',
    marginTop: '3px',
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
          <span style={chipSubtitleStyle}>{updatedText}</span>
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
