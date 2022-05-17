import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect } from 'react'

const Map = () => {
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/satellite-v9',
      projection: 'globe', // @ts-ignore
      maxZoom: 5,
      zoom: 1,
      center: [2, 35],
    })
    map.on('load', () => {
      map.setFog({
        color: 'rgb(0, 0, 0.1)',
        'space-color': '#000', // @ts-ignore
        'star-intensity': 0.3,
        'horizon-blend': 0.01,
        range: [-1, 0],
      })
    })

    return () => {
      map.stop()
    }
  }, [])

  return <div id="map" className="w-full h-full" />
}

export default Map
