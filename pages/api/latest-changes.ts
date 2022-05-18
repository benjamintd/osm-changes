import tilebelt from '@mapbox/tilebelt'
import type { NextApiRequest, NextApiResponse } from 'next'
import util from 'util'
import zlib from 'zlib'

const gunzip = util.promisify(zlib.gunzip)

export interface PointProperties {
  nodeId: string
  timestamp: number
}

export type ChangesFC = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PointProperties
>

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChangesFC>
) {
  const state = await fetch(
    'https://planet.openstreetmap.org/replication/minute/state.txt'
  ).then((res) => res.text())
  const sequenceNumber = +state.split('\n')[1].split('=')[1] // @todo maybe allow the api to fetch the previous ones as well?
  const s = sequenceNumber.toString().padStart(9, '0')
  const changesetUrl = `https://planet.openstreetmap.org/replication/minute/${s.slice(
    0,
    3
  )}/${s.slice(3, 6)}/${s.slice(6, 9)}.osc.gz`

  const changesetBuffer = await fetch(changesetUrl).then((res) =>
    res.arrayBuffer()
  )
  const changesetXml = await gunzip(changesetBuffer)
  const featureCollection = xmlToFeatureCollection(changesetXml, sequenceNumber)

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=29, stale-while-revalidate=59'
  )
  res.status(200).json(featureCollection)
}

const xmlToFeatureCollection = (
  xml: Buffer,
  sequenceNumber: number
): ChangesFC => {
  let marker = 0
  let startNode,
    startRelation,
    startId,
    endId,
    startTimestamp,
    startLat,
    endLat,
    startLon,
    endLon

  const features = []

  const occupiedTiles = new Set()
  const dedupeTileZoom = 17

  // a while true of at most 10000 features per changeset
  for (let i = 0; i < 10000; i++) {
    startNode = xml.indexOf('<node', marker, 'utf-8')
    startRelation = xml.indexOf('<relation', marker, 'utf-8')

    if (startNode === -1 && startRelation === -1) {
      break
    }

    startId = xml.indexOf('id="', Math.min(startNode, startRelation), 'utf-8')
    endId = xml.indexOf('"', startId + 5, 'utf-8')
    startTimestamp = xml.indexOf('timestamp="', endId, 'utf-8')
    startLat = xml.indexOf('lat="', startTimestamp + 30, 'utf-8')
    endLat = xml.indexOf('"', startLat + 6, 'utf-8')
    startLon = xml.indexOf('lon="', endLat, 'utf-8')
    endLon = xml.indexOf('"', startLon + 6, 'utf-8')

    marker = endLon + 1

    let nodeId = xml.slice(startId + 4, endId).toString('utf-8')
    let timestamp = new Date(
      xml.slice(startTimestamp + 11, startTimestamp + 31).toString('utf-8')
    ).getTime()
    let lat = +xml.slice(startLat + 5, endLat).toString('utf-8')
    let lon = +xml.slice(startLon + 5, endLon).toString('utf-8')

    const tile = tilebelt.pointToTile(lon, lat, dedupeTileZoom).join('/')

    if (!occupiedTiles.has(tile)) {
      // @todo add the user to the feature properties
      let feature: GeoJSON.Feature<GeoJSON.Point, PointProperties> = {
        type: 'Feature',
        properties: { nodeId, timestamp },
        geometry: { type: 'Point', coordinates: [lon, lat] },
        id: sequenceNumber * 10000 + i,
      }

      features.push(feature)
      occupiedTiles.add(tile)
    }
  }

  return { type: 'FeatureCollection', features }
}
