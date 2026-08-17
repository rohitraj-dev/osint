import React from 'react';

const GeminiPanel = ({ selectedAnomaly, onAnalyse, analysisText, isLoading, isOpen, onClose }) => {
  if (!isOpen) return null;

  const renderAnalysisText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let color = 'var(--text-sec)';
      let fontWeight = '400';
      let content = line;

      if (line.includes('Risk Level:')) {
        return (
          <div key={i} style={{ marginBottom: '4px' }}>
            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Risk Level:</span>
            {line.split('Risk Level:')[1]}
          </div>
        );
      }
      if (line.includes('Recommend:')) {
        return (
          <div key={i} style={{ color: 'var(--warn)', marginBottom: '4px' }}>
            {line}
          </div>
        );
      }
      return (
        <div key={i} style={{ color, fontWeight, marginBottom: '4px' }}>
          {content}
        </div>
      );
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      backgroundColor: 'var(--surface)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border)',
    }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .skeleton-line {
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          margin-bottom: 8px;
          animation: pulse 1.5s infinite ease-in-out;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>AI ANALYSIS</span>
        <div style={{ 
          backgroundColor: 'rgba(41,148,240,0.12)', 
          color: 'var(--accent)', 
          fontSize: '9px', 
          padding: '3px 10px', 
          borderRadius: '4px',
          fontWeight: 600
        }}>
          Gemini Flash
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border)', width: '100%', marginTop: '14px' }} />

      {/* Selected Anomaly Section */}
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-dim)', padding: '12px 20px 8px' }}>
        Selected Anomaly
      </div>

      <div style={{ 
        margin: '0 20px', 
        backgroundColor: 'var(--surface-el)', 
        borderRadius: '8px', 
        padding: '10px 12px',
        borderLeft: '3px solid var(--danger)',
        position: 'relative'
      }}>
        {selectedAnomaly ? (
          <>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pri)' }}>
              {selectedAnomaly.callsign}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '2px' }}>
              {selectedAnomaly.type} · {selectedAnomaly.zone}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--warn)', marginTop: '4px' }}>
              Anomaly Score: {selectedAnomaly.score}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '11px' }}>
            No anomaly selected
          </div>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border)', width: '100%', margin: '16px 0' }} />

      {/* Analyse Button */}
      <button
        onClick={onAnalyse}
        disabled={isLoading || !selectedAnomaly}
        style={{
          margin: '0 20px',
          height: '40px',
          backgroundColor: 'var(--accent)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: isLoading || !selectedAnomaly ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading || !selectedAnomaly ? 0.6 : 1,
          width: 'calc(100% - 40px)'
        }}
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            Analysing…
          </>
        ) : (
          '✦ Analyse with Gemini'
        )}
      </button>

      {/* Analysis Section Label */}
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-dim)', padding: '16px 20px 8px' }}>
        Analysis
      </div>

      {/* Analysis Output Card */}
      <div style={{
        margin: '0 20px',
        backgroundColor: 'var(--surface-el)',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '120px',
        maxHeight: 'calc(100vh - 350px)',
        overflowY: 'auto',
        fontSize: '11px',
        lineHeight: 1.6
      }}>
        {!selectedAnomaly && !analysisText && !isLoading && (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Select an anomaly and click Analyse.</div>
        )}
        {selectedAnomaly && !analysisText && !isLoading && (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Click Analyse to start AI processing.</div>
        )}
        {isLoading && (
          <>
            <div className="skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton-line" style={{ width: '100%' }} />
            <div className="skeleton-line" style={{ width: '70%' }} />
          </>
        )}
        {!isLoading && renderAnalysisText(analysisText)}
      </div>
      
      {/* Close button - requested in original but not in layout, adding for usability */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          fontSize: '18px'
        }}
      >
        &times;
      </button>
    </div>
  );
};

export default GeminiPanel;
