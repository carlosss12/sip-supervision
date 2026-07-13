import axios, { AxiosError } from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    // Detectamos si el error 401 proviene del endpoint de login
    const isLoginRequest = err.config?.url?.includes('/login')

    // Si es un 401 pero NO es el login, limpiamos sesión y recargamos
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.clear()
      window.location.reload()
    }
    
    return Promise.reject(err)
  }
)

export default apiClient