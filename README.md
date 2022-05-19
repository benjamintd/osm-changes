# OSM Live Changes

An app that retrieves the latest changes from the OSM minutely diffs, and displays them in near real-time, (with a fixed offset between 1 and 2 minutes).

## How

It's a Next.js app that uses the [OSM minute diffs](https://planet.openstreetmap.org/replication/minute/) in osc format. It's parsed into GeoJSON by an API route. The API response is cached on the Vercel CDN, so no more than 1 request per 30 seconds is sent to the OSM servers.

The front-end uses Mapbox GL JS to display the changesets. The data is sent to a webworker which sends updates to the map. The `featureState` of the displayed features is updated every 50 ms. Because we compute the fixed offset upon receiving the first API response, the updates will show up as they happened (with a minute or two of delay).

## Limitiations

Currently, only node additions, deletions, and updates are shown, because the coordinates of edited relations or ways are not available in the diff files.

## See also

Inspired by https://github.com/cstenac/osm-livechanges
