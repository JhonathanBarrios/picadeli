import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'
import { UserPlus, Shield, User, Calendar } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'vendedor'
  created_at: string
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'vendedor'>('vendedor')
  const [newUserPassword, setNewUserPassword] = useState('')

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error: any) {
      toast.error('Error al cargar usuarios')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUserEmail || !newUserPassword) {
      toast.error('Completa todos los campos')
      return
    }

    try {
      // Call Edge Function to create user without affecting current session
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserName,
          role: newUserRole,
        },
      })

      if (error) {
        // Try to get the specific error message from the Edge Function
        const errorMessage = error.context?.message || error.message || 'Error desconocido'
        throw new Error(errorMessage)
      }

      toast.success('Usuario creado exitosamente')
      setShowModal(false)
      setNewUserEmail('')
      setNewUserName('')
      setNewUserPassword('')
      fetchProfiles()
    } catch (error: any) {
      toast.error('Error al crear usuario: ' + error.message)
      console.error(error)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendedor') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success('Rol actualizado')
      fetchProfiles()
    } catch (error: any) {
      toast.error('Error al actualizar rol')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">👥 Gestión de Usuarios</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors border-l-4 ${
              profile.role === 'admin' ? 'border-l-emerald-500' : 'border-l-blue-500'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {profile.full_name || 'Sin nombre'}
                </h3>
                <p className="text-slate-400 text-sm truncate">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <select
                  value={profile.role}
                  onChange={(e) => updateUserRole(profile.id, e.target.value as 'admin' | 'vendedor')}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Crear Nuevo Usuario</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rol
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'vendedor')}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
