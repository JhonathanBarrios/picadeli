import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, updatePassword } = useAuthStore()
  const [profileData, setProfileData] = useState({
    full_name: '',
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
      })
    }
  }, [user])

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
        },
      })

      if (error) throw error
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      toast.error('Error al actualizar perfil: ' + error.message)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      await updatePassword(passwordData.newPassword)
      toast.success('Contraseña actualizada correctamente')
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">⚙️ Configuración</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Perfil</h2>
              <p className="text-slate-400 text-sm">Actualiza tu información personal</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <p className="text-slate-500 text-xs mt-1">El email no se puede cambiar</p>
            </div>

            <button
              onClick={handleUpdateProfile}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Seguridad</h2>
              <p className="text-slate-400 text-sm">Cambia tu contraseña</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
