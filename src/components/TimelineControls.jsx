import { useEffect, useMemo, useState } from 'react'
import { useHistoryData } from '../hooks/useHistoryData.js'

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'No timestamp selected'
  }

  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`
}

function interpolateTimestamp(earliest, latest, sliderValue) {
  const start = new Date(earliest).getTime()
  const end = new Date(latest).getTime()
  const nextValue = start + ((end - start) * sliderValue) / 100

  return new Date(nextValue).toISOString()
}

function TimelineControls({ onTimestampChange }) {
  const { earliest, latest, loading, usingMock } = useHistoryData()
  const [sliderValue, setSliderValue] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasActivated, setHasActivated] = useState(false)

  const selectedTimestamp = useMemo(() => {
    if (!earliest || !latest || !hasActivated) {
      return null
    }

    return interpolateTimestamp(earliest, latest, sliderValue)
  }, [earliest, hasActivated, latest, sliderValue])

  useEffect(() => {
    onTimestampChange(selectedTimestamp)
  }, [onTimestampChange, selectedTimestamp])

  useEffect(() => {
    if (!isPlaying || !earliest || !latest) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setHasActivated(true)
      setSliderValue((current) => {
        if (current >= 100) {
          return 0
        }

        return current + 1
      })
    }, 2000)

    return () => clearInterval(intervalId)
  }, [earliest, isPlaying, latest])

  const handleSliderChange = (event) => {
    setHasActivated(true)
    setSliderValue(Number(event.target.value))
  }

  const handlePlayToggle = () => {
    if (!earliest || !latest) {
      return
    }

    setHasActivated(true)
    setIsPlaying((current) => !current)
  }

  return (
    <div className="timeline-controls">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={sliderValue}
        disabled={loading || !earliest || !latest}
        onChange={handleSliderChange}
        className="timeline-controls__slider"
      />
      <div className="timeline-controls__meta">
        <span>{loading ? 'Loading timeline...' : formatTimestamp(selectedTimestamp)}</span>
        <div className="timeline-controls__actions">
          {usingMock ? <span className="timeline-controls__badge">Mock data</span> : null}
          <button
            type="button"
            className="timeline-controls__button"
            disabled={loading || !earliest || !latest}
            onClick={handlePlayToggle}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimelineControls
