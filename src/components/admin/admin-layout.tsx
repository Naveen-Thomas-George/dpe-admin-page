"use client"

// ...existing code...
import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Newspaper, BarChart3, LogOut, Moon, Sun, Menu, X, Trophy, Calendar } from "lucide-react"
import { signOut } from "@aws-amplify/auth"
import { useRouter } from "next/navigation"

// ...existing code...
interface AdminLayoutProps {
  children: React.ReactNode
  activeSection: string
  onSectionChange: (section: "scan" | "news" | "graphs" | "scoreboard" | "fixtures") => void
}

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()

  // Add mounted effect
  useEffect(() => {
    setMounted(true)
  }, [])

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  useEffect(() => {
    const initializeDarkMode = () => {
      const savedDarkMode = localStorage.getItem('adminDarkMode') // Match the key used in toggleDarkMode
      if (savedDarkMode !== null) {
        const isDark = JSON.parse(savedDarkMode)
        requestAnimationFrame(() => {
          setIsDarkMode(isDark)
          applyDarkMode(isDark)
        })
      } else {
        applyDarkMode(true)
      }
    }
    
    initializeDarkMode()
  }, [])

  // handleLogout function
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login') // Adjust the route as needed
    } catch (error) {
      console.error('Error signing out:', error)
      // Optionally add error handling UI feedback here
    }
  }

  // toggleDarkMode function
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    applyDarkMode(newDarkMode)
    localStorage.setItem('adminDarkMode', JSON.stringify(newDarkMode)) // Save preference
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="flex h-screen bg-background text-foreground">
        <aside
          className={`border-r border-sidebar-border bg-sidebar flex flex-col shadow-lg transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border shrink-0">
            <h1 className="text-xl font-bold text-sidebar-foreground">Admin Panel</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Sports Event Manager</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <NavButton
              icon={<QrCode className="w-5 h-5" />}
              label="Scan Tool"
              isActive={activeSection === "scan"}
              onClick={() => onSectionChange("scan")}
            />
            <NavButton
              icon={<Newspaper className="w-5 h-5" />}
              label="News Section"
              isActive={activeSection === "news"}
              onClick={() => onSectionChange("news")}
            />
            <NavButton
              icon={<Trophy className="w-5 h-5" />}
              label="Scoreboard Control"
              isActive={activeSection === "scoreboard"}
              onClick={() => onSectionChange("scoreboard")}
            />
            <NavButton
              icon={<Calendar className="w-5 h-5" />}
              label="Fixtures Control"
              isActive={activeSection === "fixtures"}
              onClick={() => onSectionChange("fixtures")}
            />
            <NavButton
              icon={<BarChart3 className="w-5 h-5" />}
              label="Graph Control"
              isActive={activeSection === "graphs"}
              onClick={() => onSectionChange("graphs")}
            />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent bg-transparent transition-colors"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start gap-2 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background flex flex-col">
          <div className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-foreground hover:bg-accent"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <h2 className="text-lg font-semibold text-foreground">
                {activeSection === "scan" && "QR Code Scanner"}
                {activeSection === "news" && "News Management"}
                {activeSection === "scoreboard" && "Scoreboard Control"}
                {activeSection === "fixtures" && "Fixtures Control"}
                {activeSection === "graphs" && "Graph Control"}
              </h2>
              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
// ...existing code...