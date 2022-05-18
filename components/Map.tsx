import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MutableRefObject, useEffect, useState } from 'react'
import { ChangesFC, PointProperties } from '../pages/api/latest-changes'

const Map = ({
  mapRef,
  fc,
}: {
  mapRef: MutableRefObject<mapboxgl.Map | null>
  fc: ChangesFC
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/benjamintd/cl3bswrm4003m15qqzdag7ydf',
      projection: 'globe',
      maxZoom: 5,
      zoom: 1,
      center: [2, 35],
    } as any) // we're using the new globe API
    map.on('load', () => {
      map.setFog({
        color: 'rgb(0, 0, 0.1)',
        'space-color': '#000',
        'star-intensity': 0.3,
        'horizon-blend': 0.01,
        range: [-1, 0],
      } as any) // we're using the new globe API

      map.addSource('changes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'earthquakes-heat',
        type: 'heatmap',
        source: 'changes',
        paint: {
          // Increase the heatmap weight based on frequency and property magnitude
          'heatmap-weight': ['number', ['feature-state', 'intensity'], 0],
          // Increase the heatmap color weight weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          'heatmap-intensity': 0.2,
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparancy color
          // to create a blur-like effect.
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(185, 28, 28, 0)',
            0.2,
            '#dc2626',
            0.4,
            '#ef4444',
            0.6,
            '#f87171',
            0.8,
            '#fca5a5',
            1,
            '#fca5a5',
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': 15,
          'heatmap-opacity': 0.5,
        },
      })

      map.addLayer({
        id: 'changes-wave',
        type: 'circle',
        source: 'changes',
        paint: {
          'circle-color': '#fff',
          'circle-opacity': [
            '-',
            ['number', ['feature-state', 'intensity'], 0],
            0.9,
          ],
          'circle-radius': [
            '+',
            10,
            ['*', 100, ['-', 1, ['number', ['feature-state', 'intensity'], 0]]],
          ],
        },
      })

      map.addLayer({
        id: 'changes',
        type: 'circle',
        source: 'changes',
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['number', ['feature-state', 'intensity'], 0],
            0,
            '#991b1b',
            0.95,
            '#ef4444',
            1,
            '#f87171',
          ],
          'circle-opacity': [
            '*',
            ['number', ['feature-state', 'intensity'], 0],
            1.5,
          ],
          'circle-radius': [
            '*',
            10,
            ['-', ['number', ['feature-state', 'intensity'], 0], 0.2],
          ],
        },
      })

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      })

      const timeFormatter = new Intl.RelativeTimeFormat('en', {
        localeMatcher: 'best fit',
        numeric: 'auto',
      })

      map.on('mouseenter', 'changes', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer'
        const { x, y } = e.point
        const halfPixels = 5

        const features = map.queryRenderedFeatures(
          [
            [x - halfPixels, y - halfPixels],
            [x + halfPixels, y + halfPixels],
          ],
          {
            layers: ['changes'],
          }
        )
        const feature = e.features?.[0]
        if (isPointFeature(feature)) {
          // Copy coordinates array.
          const coordinates = feature.geometry.coordinates.slice() as [
            number,
            number
          ]
          const edits = features.reduce((a, b) => a + b.properties!.edits, 0)
          const description = `${edits} edit${
            edits > 1 ? 's' : ''
          }, ${timeFormatter.format(
            Math.round((feature.properties.timestamp - Date.now()) / 60000),
            'minutes'
          )} by ${feature.properties.user}`

          // Populate the popup and set its coordinates
          // based on the feature found.
          popup.setLngLat(coordinates).setHTML(description).addTo(map)
        }
      })

      map.on('mouseleave', 'changes', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      mapRef.current = map
      setIsLoaded(true)
    })

    return () => {
      map.stop()
    }
  }, [mapRef])

  useEffect(() => {
    if (mapRef.current && isLoaded) {
      ;(mapRef.current.getSource('changes') as mapboxgl.GeoJSONSource).setData(
        fc
      )
    }
  }, [fc, mapRef, isLoaded])

  return <div id="map" className="w-full h-full" />
}

function isPointFeature(
  f: any
): f is GeoJSON.Feature<GeoJSON.Point, PointProperties> {
  try {
    return (
      f.type === 'Feature' &&
      f.geometry.type === 'Point' &&
      f.properties.timestamp &&
      f.properties.nodeId
    )
  } catch (error) {
    return false
  }
}

export default Map
