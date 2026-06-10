import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '../utils/currency'
import { ShoppingCart, Trash2, Package, CheckCircle, Clock } from 'lucide-react'

interface Order {
  id: string
  order_number: number
  vendedor_id: string
  total: number
  status: 'pendiente' | 'armado' | 'entregado'
  notes: string | null
  created_at: string
  profiles: {
    email: string
    full_name: string | null
  }
  order_items: {
    id: string
    product_id: string
    quantity: number
    price: number
    subtotal: number
    products: {
      name: string
    }
  }[]
}

interface OrderCardProps {
  order: Order
}

function OrderCard({ order }: OrderCardProps) {
  const { isAdmin } = useAuthStore()

  const updateOrderStatus = async (orderId: string, newStatus: 'pendiente' | 'armado' | 'entregado') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Estado actualizado')
      window.location.reload()
    } catch (error: any) {
      toast.error('Error al actualizar estado')
      console.error(error)
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error
      toast.success('Pedido eliminado')
      window.location.reload()
    } catch (error: any) {
      toast.error('Error al eliminar pedido')
      console.error(error)
    }
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700 border-l-4 ${
      order.status === 'pendiente' ? 'border-l-yellow-500' :
      order.status === 'armado' ? 'border-l-blue-500' :
      order.status === 'entregado' ? 'border-l-green-500' : 'border-l-gray-500'
    }`}>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold text-white">
              #{String(order.order_number).padStart(6, '0')}
            </h3>
            <p className="text-slate-400 text-xs">
              {order.profiles.full_name || order.profiles.email}
            </p>
            <p className="text-slate-400 text-xs">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-emerald-400">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {isAdmin() && (
          <div className="flex gap-2">
            {order.status === 'pendiente' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'armado')}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Package className="w-3 h-3" />
                Armado
              </button>
            )}
            {order.status === 'armado' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'entregado')}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                Entregado
              </button>
            )}
            <button
              onClick={() => deleteOrder(order.id)}
              className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
              title="Eliminar pedido"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {order.notes && (
          <p className="text-slate-400 text-xs">
            {order.notes}
          </p>
        )}

        {order.order_items && order.order_items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-1">Items:</p>
            <div className="space-y-1">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-slate-300">
                    {item.quantity}x {item.products.name}
                  </span>
                  <span className="text-slate-400">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
        .select('*, profiles(email, full_name), order_items(*, products(name))')
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
          <p className="text-slate-400 text-lg mb-4">No hay pedidos registrados</p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Ir al Menú de Gomitas
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pendientes */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Pendientes</h2>
              <span className="ml-auto bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                {orders.filter(o => o.status === 'pendiente').length}
              </span>
            </div>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'pendiente').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Armados */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
              <Package className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Armados</h2>
              <span className="ml-auto bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                {orders.filter(o => o.status === 'armado').length}
              </span>
            </div>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'armado').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Entregados */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Entregados</h2>
              <span className="ml-auto bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                {orders.filter(o => o.status === 'entregado').length}
              </span>
            </div>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'entregado').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
