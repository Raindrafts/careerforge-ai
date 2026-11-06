import axios from 'axios'
import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Let individual screens show API errors.  A transient backend 401 must not
// erase a valid Supabase browser session and bounce the user back to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)
