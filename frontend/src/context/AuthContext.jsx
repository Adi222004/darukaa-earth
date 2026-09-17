import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password })
    const { data } = await api.post('/api/auth/login', body)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  const register = async (email, password) => {
    setLoading(true)
    try {
      await api.post('/api/auth/register', { email, password })
      await login(email, password)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
