import React, { useCallback, useEffect, useRef } from 'react'

function formatTimestamp(date) {
  if (!date) return '—'
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds} UTC`
}

const TimelineControls = ({ 
  isLive, 
  currentTime, 
  onTimeChange, 
  onPlayPause, 
  isPlaying, 
  playbackSpeed, 
  onSpeedChange,
  earliest,
  latest,
  isLoading
}) => {
  const scrubberRef = useRef(null)

  const startTime = earliest ? new Date(earliest).getTime() : 0
  const endTime = latest ? new Date(latest).getTime() : 0
  const totalDuration = endTime - startTime
  const currentMs = currentTime ? new Date(currentTime).getTime() : startTime
  const progress = totalDuration > 0 ? (currentMs - startTime) / totalDuration : 0

  const handleScrubberClick = (e) => {
    if (isLoading || !totalDuration) return
    const rect = scrubberRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = new Date(startTime + totalDuration * percentage)
    onTimeChange(newTime)
  }

  const handleThumbMouseDown = (e) => {
    if (isLoading || !totalDuration) return
    const handleMouseMove = (moveEvent) => {
      const rect = scrubberRef.current.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = new Date(startTime + totalDuration * percentage)
      onTimeChange(newTime)
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const cycleSpeed = () => {
    const speeds = [1, 2, 5, 0.5]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    onSpeedChange(speeds[nextIndex])
  }

  const timeLabels = ['00:00', '06:00', '12:00', '18:00', '24:00']

  return (
    <div style={{
      width: '100%',
      height: '64px',
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      position: 'relative',
      boxSizing: 'border-box',
      zIndex: 1000
    }}>
      <style>{`
        .scrubber-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Play/Pause Button */}
      <button
        onClick={onPlayPause}
        disabled={isLoading}
        style={{
          width: '36px',
          height: '36px',
          backgroundColor: 'var(--accent)',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          color: 'white',
          fontSize: '14px',
          padding: 0,
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isPlaying ? '▐▐' : '▶'}
      </button>

      {/* Current Timestamp */}
      <div style={{
        marginLeft: '12px',
        fontSize: '11px',
        color: 'var(--text-sec)',
        width: '180px',
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums'
      }}>
        {isLoading ? 'Loading...' : formatTimestamp(currentTime)}
      </div>

      {/* Scrubber Section */}
      <div style={{
        flex: 1,
        margin: '0 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        height: '100%'
      }}>
        {/* Track */}
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--surface-el)',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          {/* Filled portion */}
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: 'var(--accent)',
            borderRadius: '2px'
          }} />
          
          {/* Thumb */}
          <div
            className="scrubber-thumb"
            onMouseDown={handleThumbMouseDown}
            style={{
              position: 'absolute',
              left: `${progress * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              backgroundColor: 'var(--accent)',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'grab',
              transition: 'transform 0.1s'
            }}
          />
        </div>

        {/* Time Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          width: '100%'
        }}>
          {timeLabels.map((label, i) => (
            <span key={label} style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              position: 'absolute',
              left: `${(i / (timeLabels.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
              top: '40px'
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Speed Indicator */}
      <div
        onClick={cycleSpeed}
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-sec)',
          cursor: 'pointer',
          marginRight: '20px',
          userSelect: 'none',
          width: '30px',
          textAlign: 'center'
        }}
      >
        {playbackSpeed}×
      </div>

      {/* Data Mode Badge */}
      <div style={{
        backgroundColor: 'var(--surface-el)',
        borderRadius: '5px',
        padding: '3px 10px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontWeight: 500
        }}>
          {isLive ? 'Live' : 'Mock Data'}
        </span>
      </div>
    </div>
  )
}

export default TimelineControls
