"use client"

import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LogOut,
  Trophy,
  Users,
  Calendar,
  BarChart3,
  TrophyIcon,
  UserCog,
  Menu,
  X,
  Castle as Whistle,
  ClipboardList,
  UserCircle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

export function Sidebar({ activeTab, onTabChange, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: "tournaments", label: "Torneos", icon: Trophy },
    { id: "teams", label: "Equipos", icon: Users },
    { id: "players", label: "Jugadores", icon: UserCircle },
    { id: "coaches", label: "Entrenadores", icon: ClipboardList },
    { id: "referees", label: "Árbitros", icon: Whistle },
    { id: "matches", label: "Partidos", icon: Calendar },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "profile", label: "Mi Perfil", icon: User },
  ]

  if (user?.role === "admin") {
    menuItems.push({ id: "users", label: "Usuarios", icon: UserCog })
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Desktop collapse/expand button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "hidden md:flex fixed top-4 z-50 transition-all duration-300",
          isCollapsed ? "left-[52px]" : "left-[244px]",
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn("flex items-center gap-2 p-6", isCollapsed && "justify-center p-4")}>
            <TrophyIcon className={cn("h-8 w-8 text-green-600", isCollapsed && "h-6 w-6")} />
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold">Torneo Fut</h1>
                <p className="text-xs text-muted-foreground">Gestión Deportiva</p>
              </div>
            )}
          </div>

          <Separator />

          {/* User info */}
          {!isCollapsed && (
            <>
              <div className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photo || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === "admin"
                        ? "Administrador"
                        : user?.role === "referee"
                          ? "Árbitro"
                          : user?.role === "coach"
                            ? "Entrenador"
                            : "Aficionado"}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <nav className="space-y-2 p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}
                      onClick={() => {
                        onTabChange(item.id)
                        setIsOpen(false)
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                      {!isCollapsed && item.label}
                    </Button>
                  )
                })}
              </nav>
            </ScrollArea>
          </div>

          <Separator />

          {/* Theme toggle & Logout */}
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              className={cn("w-full bg-transparent", isCollapsed ? "justify-center px-2" : "justify-start")}
              onClick={toggleTheme}
              title={isCollapsed ? "Cambiar tema" : undefined}
            >
              {theme === "light" ? (
                <>
                  <Moon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && "Modo Oscuro"}
                </>
              ) : (
                <>
                  <Sun className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && "Modo Claro"}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className={cn("w-full bg-transparent", isCollapsed ? "justify-center px-2" : "justify-start")}
              onClick={logout}
              title={isCollapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Cerrar Sesión"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
