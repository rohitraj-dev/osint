import React, { useState } from 'react';

const GeminiPanel = ({ anomalies, aircraft, vessels, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const analyzeAnomalies = async () => {
    setLoading(true);
    setError('');
    setSummary('');

    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    const prompt = `You are an OSINT domain awareness analyst. Summarise these flagged anomalies in 3-5 sentences, noting asset types, locations, and potential significance. Some assets are flagged as near sensitive zones. Consider zone proximity in your analysis. 
    Anomalies: ${JSON.stringify(anomalies, null, 2)}
    Aircraft in area: ${JSON.stringify(aircraft?.filter(a => a.nearZone), null, 2)}
    Vessels in area: ${JSON.stringify(vessels?.filter(v => v.nearZone), null, 2)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available.';
      setSummary(text);
    } catch (err) {
      setError(`Failed to analyze anomalies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '340px',
      height: '100vh',
      backgroundColor: '#0d1117cc',
      color: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-2px 0 5px rgba(0,0,0,0.5)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>🛰 Anomaly Analysis</h2>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          &times;
        </button>
      </div>

      <button
        onClick={analyzeAnomalies}
        disabled={loading}
        style={{
          padding: '10px',
          backgroundColor: '#238636',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Analysing...' : 'Analyse Anomalies'}
      </button>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ textAlign: 'center' }}>Loading...</div>}
        {error && <div style={{ color: '#f85149' }}>{error}</div>}
        {summary && (
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem' }}>
            {summary}
          </p>
        )}
      </div>
    </div>
  );
};

export default GeminiPanel;
