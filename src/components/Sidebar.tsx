import { motion } from 'motion/react'
import { LayoutDashboard, ShoppingCart, Users, Settings, LogOut, X, Candy } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Sidebar({ isOpen, onOpenChange }: SidebarProps) {
  const { signOut, profile, isAdmin } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'products', label: 'Menú Gomitas', icon: Candy, path: '/products' },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart, path: '/orders' },
    ...(isAdmin() ? [{ id: 'users', label: 'Usuarios', icon: Users, path: '/users' }] : []),
    ...(isAdmin() ? [{ id: 'settings', label: 'Configuración', icon: Settings, path: '/settings' }] : []),
  ]

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const getUserInitials = () => {
    if (!profile?.full_name) return profile?.email?.[0]?.toUpperCase() || 'U'
    return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => onOpenChange?.(false)}
        />
      )}

      {/* Sidebar */}
      <div className="hidden lg:block w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Candy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Picadeli</h1>
              <p className="text-slate-400 text-xs">Gestión de Gomitas</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{getUserInitials()}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{profile?.full_name || 'Usuario'}</p>
                <p className="text-slate-400 text-xs">{profile?.email || ''}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Candy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Picadeli</h1>
              <p className="text-slate-400 text-xs">Gestión de Gomitas</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  navigate(item.path)
                  onOpenChange?.(false)
                }}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{getUserInitials()}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{profile?.full_name || 'Usuario'}</p>
                <p className="text-slate-400 text-xs">{profile?.email || ''}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
