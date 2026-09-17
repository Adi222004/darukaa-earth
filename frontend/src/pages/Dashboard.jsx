import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import MapView from '../components/MapView'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [sites, setSites] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/sites'),
      ])
      setProjects(p.data)
      setSites(s.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await api.post('/api/projects', form)
      setForm({ name: '', description: '' })
      await load()
    } finally {
      setCreating(false)
    }
  }

  const totalArea = sites.reduce((sum, s) => sum + (s.area_hectares || 0), 0)

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{projects.length}</span>
            <span className="stat-label">Projects</span>
          </div>
          <div className="stat">
            <span className="stat-value">{sites.length}</span>
            <span className="stat-label">Sites</span>
          </div>
          <div className="stat">
            <span className="stat-value">{(totalArea / 1000).toFixed(1)}k</span>
            <span className="stat-label">Hectares</span>
          </div>
        </div>

        <h2>New project</h2>
        <form onSubmit={handleCreate} className="create-form">
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create project'}
          </button>
        </form>

        <h2>Your projects</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="muted">No projects yet — create one above.</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`}>
                  <strong>{p.name}</strong>
                  <span className="muted">
                    {p.description || 'No description'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="map-container">
        <MapView sites={sites} />
        <div className="map-overlay">
          <span>All sites across India</span>
        </div>
      </main>
    </div>
  )
}
