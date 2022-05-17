import type { NextApiRequest, NextApiResponse } from 'next'
import util from 'util'
import zlib from 'zlib'

const gunzip = util.promisify(zlib.gunzip)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
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
  const changeset = await gunzip(changesetBuffer)

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )

  res.status(200).send(changeset)
}
