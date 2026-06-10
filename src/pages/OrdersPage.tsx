import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

interface Order {
  id: string
  vendedor_id: string
  total: number
  status: 'pendiente' | 'armado' | 'entregado'
  notes: string | null
  created_at: string
  profiles: {
    email: string
    full_name: string | null
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin, isVendedor } = useAuthStore()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })

      // Vendors only see their own orders
      if (isVendedor()) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          query = query.eq('vendedor_id', user.id)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Error al cargar pedidos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'pendiente' | 'armado' | 'entregado') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Estado actualizado')
      fetchOrders()
    } catch (error: any) {
      toast.error('Error al actualizar estado')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-500'
      case 'armado':
        return 'bg-blue-500'
      case 'entregado':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
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
      <h1 className="text-3xl font-bold text-white mb-6">📋 Gestión de Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Pedido #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Vendedor: {order.profiles.full_name || order.profiles.email}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-400">
                    ${order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>

                {isAdmin() && (
                  <div className="flex gap-2">
                    {order.status === 'pendiente' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'armado')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Marcar como Armado
                      </button>
                    )}
                    {order.status === 'armado' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'entregado')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Marcar como Entregado
                      </button>
                    )}
                  </div>
                )}
              </div>

              {order.notes && (
                <p className="text-slate-400 text-sm mt-3">
                  Notas: {order.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
