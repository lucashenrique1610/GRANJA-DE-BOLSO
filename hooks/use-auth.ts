"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  nome: string
  email: string
  telefone?: string
  [key: string]: unknown
}

const SESSION_KEY = "granja_session"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Handle Supabase Auth Redirect (Hash Fragment)
      if (typeof window !== "undefined" && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1))
        const access_token = params.get("access_token")
        const type = params.get("type")
        
        if (access_token) {
           const session = { access_token, refresh_token: params.get("refresh_token") }
           localStorage.setItem(SESSION_KEY, JSON.stringify(session))
           
           if (type === "recovery") {
             setNeedsPasswordReset(true)
           }
           
           // Clean URL
           window.history.replaceState(null, "", window.location.pathname)
        }
      }

      try {
        const storedSession = localStorage.getItem(SESSION_KEY)
        if (!storedSession) {
          setUser(null)
          setLoading(false)
          return
        }

        const { access_token } = JSON.parse(storedSession)
        
        // Validate token with backend
        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        })

        if (res.ok) {
          const { user: u } = await res.json()
          const meta = (u.user_metadata || {}) as { nome?: string; telefone?: string }
          
          // Fetch profile if needed, or rely on metadata
          // Ideally backend /api/auth/user returns merged data
          
          const cur: User = { 
            id: u.id, 
            nome: String(meta.nome || ""), 
            email: String(u.email || ""), 
            telefone: meta.telefone 
          }
          
          setUser(cur)
        } else {
          // Token invalid
          localStorage.removeItem(SESSION_KEY)
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email: string, password: string): Promise<{ ok: boolean; unconfirmed?: boolean; errorMessage?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = String(data.error || "")
        const unconfirmed = /confirm|verify|verificar|confirmar/i.test(msg)
        return { ok: false, unconfirmed, errorMessage: msg }
      }

      if (data.session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.session))
        const u = data.user
        const meta = (u.user_metadata || {}) as { nome?: string; telefone?: string }
        const cur: User = { 
            id: u.id, 
            nome: String(meta.nome || ""), 
            email: String(u.email || ""), 
            telefone: meta.telefone 
        }
        setUser(cur)
        return { ok: true }
      }
      return { ok: false, errorMessage: "Sessão não criada" }
    } catch (e: any) {
      return { ok: false, errorMessage: e.message || "Erro de conexão" }
    }
  }

  const register = async (
    nome: string,
    email: string,
    password: string,
  ): Promise<{ ok: boolean; notConfigured?: boolean; errorMessage?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: { nome } })
      })

      const data = await res.json()

      if (!res.ok) {
        return { ok: false, errorMessage: data.error || "Erro ao registrar" }
      }
      
      return { ok: true }
    } catch (e: any) {
      return { ok: false, errorMessage: e.message }
    }
  }

  const updateUser = async (updatedUser: User): Promise<boolean> => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY)
      if (!storedSession) return false
      const { access_token } = JSON.parse(storedSession)

      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify({ data: { nome: updatedUser.nome, telefone: updatedUser.telefone } })
      })

      if (res.ok) {
        setUser(prev => prev ? { ...prev, ...updatedUser } : null)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      return res.ok
    } catch {
      return false
    }
  }

  const completePasswordReset = async (newPassword: string): Promise<boolean> => {
    // This usually requires a session established via the reset link
    // The reset link from Supabase usually contains a token in the URL hash (#access_token=...)
    // If the user clicks the link, the app loads.
    // We need to capture that token and set the session.
    // For now, assuming the user is "logged in" via that mechanism (which we need to handle in useEffect or a separate handler)
    // If we are logged in:
    
    try {
      const storedSession = localStorage.getItem(SESSION_KEY)
      if (!storedSession) return false
      const { access_token } = JSON.parse(storedSession)

      const res = await fetch("/api/auth/update", { // Use update user to set password
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify({ password: newPassword }) // Need to ensure /api/auth/update handles password
      })
      
      if (res.ok) {
        setNeedsPasswordReset(false)
        return true
      }
      return false
    } catch {
        return false
    }
  }
  
  // Note: /api/auth/update needs to handle password updates if we use it here.
  // My previous implementation of /api/auth/update only took `data`.
  // I should update /api/auth/update to handle password or attributes.

  const resendEmailConfirmation = async (email: string): Promise<boolean> => {
     // Not implemented in backend yet, but can be added.
     return false
  }

  const logout = async () => {
    try {
        const storedSession = localStorage.getItem(SESSION_KEY)
        if (storedSession) {
            const { access_token } = JSON.parse(storedSession)
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Authorization": `Bearer ${access_token}` }
            })
        }
    } catch {}
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    router.push("/")
  }

  const requireAuth = () => {
    if (!loading && !user) {
      router.replace("/")
    }
  }

  return {
    user,
    loading,
    needsPasswordReset,
    login,
    register,
    updateUser,
    sendPasswordReset,
    completePasswordReset,
    resendEmailConfirmation,
    logout,
    requireAuth,
    isAuthenticated: !!user,
  }
}
