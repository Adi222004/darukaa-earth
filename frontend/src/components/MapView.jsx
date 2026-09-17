import { useEffect, useMemo, useState } from 'react'
import Map, { Source, Layer, Popup } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import DrawControl from './DrawControl'

// Compute [minLng, minLat, maxLng, maxLat] from a list of sites
function bounds(sites) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const s of sites) {
    const rings = s.geometry?.coordinates || []
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat
      }
    }
  }
  if (!isFinite(minLng)) return null
  return [minLng, minLat, maxLng, maxLat]
}

export default function MapView({
  sites = [],
  interactiveDraw = false,
  onPolygonDrawn,
  onSiteClick,
}) {
  const [selected, setSelected] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4,
  })

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: sites.map((s) => ({
        type: 'Feature',
        id: s.id,
        properties: {
          id: s.id,
          name: s.name,
          area: s.area_hectares,
        },
        geometry: s.geometry,
      })),
    }),
    [sites]
  )

  // Auto-fit when sites change
  useEffect(() => {
    const b = bounds(sites)
    if (!b) return
    const [minLng, minLat, maxLng, maxLat] = b
    const lng = (minLng + maxLng) / 2
    const lat = (minLat + maxLat) / 2
    const span = Math.max(maxLng - minLng, maxLat - minLat)
    // Rough zoom calculation: 360° span ≈ zoom 0, halving → +1 zoom
    const zoom = Math.max(1, Math.min(14, Math.log2(360 / Math.max(span, 0.001)) - 1.5))
    setViewState({ longitude: lng, latitude: lat, zoom })
  }, [sites])

  const handleClick = (e) => {
    const f = e.features?.[0]
    if (f) {
      setSelected(f)
      onSiteClick?.(f.properties.id)
    }
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      onClick={handleClick}
      interactiveLayerIds={['sites-fill']}
    >
      {sites.length > 0 && (
        <Source id="sites" type="geojson" data={geojson}>
          <Layer
            id="sites-fill"
            type="fill"
            paint={{ 'fill-color': '#22c55e', 'fill-opacity': 0.4 }}
          />
          <Layer
            id="sites-outline"
            type="line"
            paint={{ 'line-color': '#15803d', 'line-width': 2 }}
          />
        </Source>
      )}

      {interactiveDraw && <DrawControl onPolygonComplete={onPolygonDrawn} />}

      {selected && (
        <Popup
          longitude={selected.geometry.coordinates[0][0][0]}
          latitude={selected.geometry.coordinates[0][0][1]}
          onClose={() => setSelected(null)}
          closeOnClick={false}
          anchor="top"
        >
          <div style={{ padding: 4 }}>
            <strong>{selected.properties.name}</strong>
            <div>{Number(selected.properties.area).toFixed(2)} ha</div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
