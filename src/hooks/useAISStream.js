import { useEffect, useRef, useState } from 'react'

const MAX_VESSELS = 500

function trimName(name) {
  return name?.trim() ?? ''
}

export function useAISStream(bounds) {
  const [vessels, setVessels] = useState(new Map())
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const vesselsRef = useRef(new Map())
  const hasLoggedFirst = useRef(false)
  const boundsKey = bounds
    ? `${bounds.getSouth().toFixed(4)},${bounds.getWest().toFixed(4)},${bounds.getNorth().toFixed(4)},${bounds.getEast().toFixed(4)}`
    : null

  useEffect(() => {
    let isCancelled = false

    setConnected(false)

    if (!bounds) {
      setError(null)
      setVessels(new Map())
      vesselsRef.current = new Map()
      return undefined
    }

    const apiKey = import.meta.env.VITE_AISSTREAM_KEY

    if (!apiKey) {
      setError('AISStream API key is missing.')
      setVessels(new Map())
      vesselsRef.current = new Map()
      return undefined
    }

    setError(null)
    const [south, west, north, east] = boundsKey.split(',').map(Number)
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream')
    wsRef.current = socket
    vesselsRef.current = new Map()
    setVessels(new Map())

    socket.onopen = () => {
      if (isCancelled) {
        socket.close()
        return
      }

        setConnected(true)
        socket.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: [
              [
                [south, west],
                [north, east],
              ],
            ],
            FilterMessageTypes: ['PositionReport'],
          }),
        )
      }

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const positionReport = msg.Message?.PositionReport

          if (!hasLoggedFirst.current) {
            console.log(msg)
            hasLoggedFirst.current = true
          }

          if (msg.MessageType !== 'PositionReport') {
            return
          }

          const mmsi = msg.MetaData?.MMSI
          const latitude = msg.MetaData?.latitude ?? positionReport?.Latitude
          const longitude = msg.MetaData?.longitude ?? positionReport?.Longitude

          if (mmsi == null || latitude == null || longitude == null) {
            return
          }

          const nextVessels = vesselsRef.current

          if (nextVessels.has(mmsi)) {
            nextVessels.delete(mmsi)
          }

          nextVessels.set(mmsi, {
            mmsi,
            shipName: trimName(msg.MetaData?.ShipName),
            latitude,
            longitude,
            sog: positionReport?.Sog,
            cog: positionReport?.Cog,
            trueHeading: positionReport?.TrueHeading,
            navStatus: positionReport?.NavigationalStatus,
          })

          while (nextVessels.size > MAX_VESSELS) {
            const oldestKey = nextVessels.keys().next().value

            if (oldestKey == null) {
              break
            }

            nextVessels.delete(oldestKey)
          }

          setVessels(new Map(nextVessels))
        } catch {
          return
        }
      }

      socket.onerror = () => {
        setConnected(false)
        setError('Unable to connect to AISStream.')
      }

      socket.onclose = () => {
        setConnected(false)
      }

    return () => {
      isCancelled = true
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
    }
  }, [boundsKey])

  return { vessels, connected, error }
}
