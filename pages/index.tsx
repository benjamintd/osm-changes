import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import Map from '../components/Map'
import { Message, UpdateMessage } from '../lib/types'
import { ChangesFC } from './api/latest-changes'

const Home: NextPage = () => {
  const { data } = useSWR('/api/latest-changes')
  const workerRef = useRef<Worker>()

  const map = useRef<mapboxgl.Map | null>(null)
  const [featureCollection, setFeatureCollection] = useState<ChangesFC>({
    type: 'FeatureCollection',
    features: [],
  })

  const updateIntensities = (updates: UpdateMessage['updates']) => {
    if (map.current) {
      for (let update of updates) {
        map.current.setFeatureState(
          { source: 'changes', id: update.id },
          { intensity: update.intensity }
        )
      }
    }
  }

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../lib/worker.ts', import.meta.url),
      {
        type: 'module',
      }
    )

    // the data is a list of {id, intensity} objects
    // which we'll use to tell mapbox what featurestates to update.
    workerRef.current.onmessage = (e) => {
      const data = e.data as Message

      switch (data.type) {
        case 'DATA':
          setFeatureCollection(data.fc)
          break
        case 'UPDATE':
          updateIntensities(data.updates)
          break
        default:
          break
      }
    }

    return () => {
      workerRef.current?.terminate?.()
    }
  }, [])

  useEffect(() => {
    // feed the data to the worker whenever it changes
    if (data) {
      workerRef.current?.postMessage(data)
    }
  }, [data])

  return (
    <>
      <Head>
        <title>Live OSM changesets</title>
      </Head>

      <main className="w-screen h-screen">
        <Map mapRef={map} fc={featureCollection} />
      </main>
    </>
  )
}

export default Home
