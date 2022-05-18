export interface DataMessage {
  type: 'DATA'
  fc: GeoJSON.FeatureCollection<
    GeoJSON.Point,
    {
      nodeId: string
      timestamp: number
      edits: number
      user: string
    }
  >
}

export interface UpdateMessage {
  type: 'UPDATE'
  updates: Array<{ id: number; intensity: number }>
}

export type Message = DataMessage | UpdateMessage
