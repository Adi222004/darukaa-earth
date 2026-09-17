import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Darukaa<span>.Earth</span>
      </Link>
      {token && (
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      )}
    </nav>
  )
}