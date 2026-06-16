import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sd_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('sd_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    await api.get('/sanctum/csrf-cookie', { baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') || '' })
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('sd_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('sd_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const hasRole = (role) => user?.roles?.some(r => r.name === role)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
