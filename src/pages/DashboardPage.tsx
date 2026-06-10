import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { ShoppingCart, Package, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface Stats {
  totalOrders: number
  totalSales: number
  pendingOrders: number
  lowStockProducts: number
  totalProducts: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    totalProducts: 0,
  })
  const [loading, setLoading] = useState(true)
  const { profile, isAdmin } = useAuthStore()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch orders stats
      let ordersQuery = supabase.from('orders').select('*')

      // Vendors only see their own stats
      if (!isAdmin()) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          ordersQuery = ordersQuery.eq('vendedor_id', user.id)
        }
      }

      const { data: orders, error: ordersError } = await ordersQuery

      if (!ordersError && orders) {
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
        const pendingOrders = orders.filter((order) => order.status === 'pendiente').length

        setStats((prev) => ({
          ...prev,
          totalOrders: orders.length,
          totalSales,
          pendingOrders,
        }))
      }

      // Fetch products stats (only for admin)
      if (isAdmin()) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')

        if (!productsError && products) {
          const lowStock = products.filter((p) => p.stock <= p.min_stock).length
          setStats((prev) => ({
            ...prev,
            totalProducts: products.length,
            lowStockProducts: lowStock,
          }))
        }

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (usersCount !== null) {
          setStats((prev) => ({ ...prev, totalOrders: prev.totalOrders })) // Reuse for now
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    gradient,
    trend,
  }: {
    title: string
    value: string | number
    icon: any
    gradient: string
    trend?: string
  }) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm text-slate-400">{trend}</span>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          👋 Hola, {profile?.full_name || profile?.email}
        </h1>
        <p className="text-slate-400">
          {isAdmin() ? 'Panel Administrativo' : 'Panel de Vendedor'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Pedidos Totales"
          value={stats.totalOrders}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Ventas Totales"
          value={`$${stats.totalSales.toLocaleString()}`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Pedidos Pendientes"
          value={stats.pendingOrders}
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        {isAdmin() && (
          <StatCard
            title="Productos con Stock Bajo"
            value={stats.lowStockProducts}
            icon={Package}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
          />
        )}
      </div>

      {isAdmin() && stats.lowStockProducts > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-white font-semibold">Alerta de Stock</h3>
              <p className="text-red-300 text-sm">
                {stats.lowStockProducts} productos con stock bajo o agotado
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">🍬 Accesos Rápidos</h2>
          <div className="space-y-3">
            <a
              href="/products"
              className="flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              <Package className="w-5 h-5" />
              <span>Ver Menú de Gomitas</span>
            </a>
            <a
              href="/orders"
              className="flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Gestionar Pedidos</span>
            </a>
            {isAdmin() && (
              <a
                href="/users"
                className="flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
              >
                <Users className="w-5 h-5" />
                <span>Gestionar Usuarios</span>
              </a>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Información</h2>
          <div className="space-y-3 text-slate-300">
            <p>
              <strong className="text-white">Rol:</strong>{' '}
              {profile?.role === 'admin' ? 'Administrador' : 'Vendedor'}
            </p>
            <p>
              <strong className="text-white">Email:</strong> {profile?.email}
            </p>
            <p>
              <strong className="text-white">Productos Activos:</strong>{' '}
              {stats.totalProducts}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
