import { useControl } from 'react-map-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export default function DrawControl({ onPolygonComplete }) {
  useControl(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: 'simple_select',
      }),
    ({ map }) => {
      const handle = (e) => {
        const feature = e.features?.[0]
        if (feature?.geometry?.type === 'Polygon') {
          onPolygonComplete(feature.geometry)
        }
      }
      map.on('draw.create', handle)
      map.on('draw.update', handle)
    },
    () => {}
  )
  return null
}
