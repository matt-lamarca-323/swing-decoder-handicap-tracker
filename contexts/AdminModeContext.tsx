'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminModeContextType {
  adminMode: boolean
  toggleAdminMode: () => void
  isAdmin: boolean
  setIsAdmin: (isAdmin: boolean) => void
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined)

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [adminMode, setAdminMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Load admin mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adminMode')
    if (saved === 'true') {
      setAdminMode(true)
    }
  }, [])

  const toggleAdminMode = () => {
    setAdminMode((prev) => {
      const newValue = !prev
      localStorage.setItem('adminMode', String(newValue))
      return newValue
    })
  }

  return (
    <AdminModeContext.Provider value={{ adminMode, toggleAdminMode, isAdmin, setIsAdmin }}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode() {
  const context = useContext(AdminModeContext)
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider')
  }
  return context
}
