import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { ShoppingCart, Package, Users, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '../utils/currency'

interface Stats {
  todaySales: number
  pendingOrders: number
  armedOrders: number
  totalProducts: number
}

interface TopProduct {
  name: string
  total_quantity: number
}

interface RecentOrder {
  order_number: number
  total: number
  status: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  }[]
}

interface VendorStats {
  full_name: string
  email: string
  total_sales: number
  order_count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    pendingOrders: 0,
    armedOrders: 0,
    totalProducts: 0,
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [vendorStats, setVendorStats] = useState<VendorStats[]>([])
  const [loading, setLoading] = useState(true)
  const { profile, isAdmin } = useAuthStore()

  useEffect(() => {
    fetchStats()
  }, [])


  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

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
        const todaySales = orders
          .filter((order) => order.status === 'entregado' && order.created_at.startsWith(today))
          .reduce((sum, order) => sum + Number(order.total), 0)
        const pendingOrders = orders.filter((order) => order.status === 'pendiente').length
        const armedOrders = orders.filter((order) => order.status === 'armado').length

        setStats((prev) => ({
          ...prev,
          todaySales,
          pendingOrders,
          armedOrders,
        }))
      }

      // Fetch products stats (only for admin)
      if (isAdmin()) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')

        if (!productsError && products) {
          setStats((prev) => ({
            ...prev,
            totalProducts: products.filter(p => p.is_active).length,
          }))
        }

        // Fetch top products
        const { data: topProductsData } = await supabase
          .from('order_items')
          .select('quantity, products(name)')
          .order('quantity', { ascending: false })
          .limit(5)

        if (topProductsData) {
          const productMap = new Map<string, number>()
          topProductsData.forEach((item: any) => {
            const name = item.products?.name || 'Desconocido'
            productMap.set(name, (productMap.get(name) || 0) + item.quantity)
          })
          setTopProducts(
            Array.from(productMap.entries())
              .map(([name, total_quantity]) => ({ name, total_quantity }))
              .sort((a, b) => b.total_quantity - a.total_quantity)
              .slice(0, 5)
          )
        }

        // Fetch recent orders
        const { data: recentOrdersData } = await supabase
          .from('orders')
          .select('order_number, total, status, created_at, profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentOrdersData) {
          setRecentOrders(recentOrdersData as RecentOrder[])
        }

        // Fetch vendor stats
        const { data: vendorData } = await supabase
          .from('orders')
          .select('vendedor_id, total, profiles(full_name, email)')
          .order('created_at', { ascending: false })

        if (vendorData) {
          const vendorMap = new Map<string, VendorStats>()
          vendorData.forEach((item: any) => {
            const id = item.vendedor_id
            const existing = vendorMap.get(id) || {
              full_name: item.profiles?.full_name || '',
              email: item.profiles?.email || '',
              total_sales: 0,
              order_count: 0,
            }
            existing.total_sales += Number(item.total)
            existing.order_count += 1
            vendorMap.set(id, existing)
          })
          setVendorStats(Array.from(vendorMap.values()).sort((a, b) => b.total_sales - a.total_sales))
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
          title="Ventas del Día"
          value={formatCurrency(stats.todaySales)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Pedidos Pendientes"
          value={stats.pendingOrders}
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <StatCard
          title="Pedidos Armados"
          value={stats.armedOrders}
          icon={Package}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        {isAdmin() && (
          <StatCard
            title="Productos Activos"
            value={stats.totalProducts}
            icon={BarChart3}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

        {isAdmin() && topProducts.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">🏆 Productos Más Vendidos</h2>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-white">{product.name}</span>
                  <span className="text-emerald-400 font-semibold">{product.total_quantity} vendidos</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAdmin() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recentOrders.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">📋 Pedidos Recientes</h2>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.order_number} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div>
                      <span className="text-white font-semibold">#{String(order.order_number).padStart(6, '0')}</span>
                      <p className="text-slate-400 text-xs">{order.profiles[0]?.full_name || order.profiles[0]?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-semibold">{formatCurrency(order.total)}</span>
                      <p className="text-slate-400 text-xs capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vendorStats.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">👥 Actividad de Vendedores</h2>
              <div className="space-y-3">
                {vendorStats.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div>
                      <span className="text-white font-semibold">{vendor.full_name || vendor.email}</span>
                      <p className="text-slate-400 text-xs">{vendor.order_count} pedidos</p>
                    </div>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(vendor.total_sales)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
