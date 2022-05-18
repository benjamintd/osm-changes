import { DataMessage, UpdateMessage } from './types'

const features = new Map()
let timestampDifference = 0

const TTL = 20000

addEventListener('message', (event) => {
  const now = Date.now()
  const featureCollection = JSON.parse(event.data)

  featureCollection.features.forEach(
    (
      feature: GeoJSON.Feature<
        GeoJSON.Point,
        { nodeId: string; timestamp: number }
      >
    ) => {
      features.set(feature.id, feature)

      if (
        !timestampDifference ||
        now - feature.properties.timestamp > timestampDifference
      ) {
        timestampDifference = now - feature.properties.timestamp
      }
    }
  )

  // filter out features that are too old
  features.forEach((feature, id) => {
    if (feature.properties.timestamp < now - timestampDifference - TTL) {
      features.delete(id)
    }
  })

  const message: DataMessage = {
    type: 'DATA',
    fc: {
      type: 'FeatureCollection',
      features: Array.from(features.values()),
    },
  }

  self.postMessage(message)
})

setInterval(() => {
  const now = Date.now()
  const updates = []
  for (let [id, feature] of features.entries()) {
    if (
      feature.properties.timestamp < now - timestampDifference &&
      feature.properties.timestamp > now - timestampDifference - TTL
    ) {
      updates.push({
        id,
        intensity:
          (TTL - (now - timestampDifference - feature.properties.timestamp)) /
          TTL,
      })
    } else if (feature.properties.timestamp < now - timestampDifference - TTL) {
      features.delete(id)
      updates.push({ id, intensity: 0 })
    }
  }

  if (updates.length > 0) {
    const message: UpdateMessage = {
      type: 'UPDATE',
      updates,
    }
    self.postMessage(message)
  }
}, 50)

export {} // make it a module
