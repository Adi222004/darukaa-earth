import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import MapView from '../components/MapView'
import MetricsChart from '../components/MetricsChart'

export default function SiteDetail() {
  const { id } = useParams()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get(`/api/sites/${id}`)
      .then((r) => {
        if (!cancelled) setSite(r.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="page"><p>Loading site…</p></div>
  if (error) return <div className="page"><p className="error-banner">{error}</p></div>
  if (!site) return null

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to dashboard
      </Link>

      <header className="site-header">
        <div>
          <h1>{site.name}</h1>
          <p className="muted">
            {site.area_hectares?.toFixed(2)} hectares ·{' '}
            {site.metrics?.length || 0} monthly readings
          </p>
        </div>
      </header>

      <section className="detail-grid">
        <div className="card">
          <h2>Performance over time</h2>
          <MetricsChart metrics={site.metrics || []} />
        </div>

        <div className="card map-card">
          <h2>Location</h2>
          <div className="mini-map">
            <MapView sites={[site]} />
          </div>
        </div>
      </section>
    </div>
  )
}
