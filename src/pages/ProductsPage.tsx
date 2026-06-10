import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  min_stock: number
  image_url: string | null
  is_active: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      toast.error('Error al cargar productos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error('Producto agotado')
      return
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error('No hay suficiente stock')
          return prevCart
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
    toast.success(`${product.name} agregado`)
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta)
          if (newQuantity > item.product.stock) {
            toast.error('No hay suficiente stock')
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const createOrder = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          vendedor_id: user.id,
          total: cartTotal,
          status: 'pendiente',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id)
      }

      // Create inventory transactions
      for (const item of cart) {
        await supabase.from('inventory_transactions').insert({
          product_id: item.product.id,
          type: 'out',
          quantity: item.quantity,
          reference: order.id,
          notes: `Pedido #${order.id.slice(0, 8)}`,
          created_by: user.id,
        })
      }

      setCart([])
      fetchProducts()
      toast.success('Pedido creado exitosamente')
    } catch (error: any) {
      toast.error('Error al crear pedido')
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
      <h1 className="text-3xl font-bold text-white mb-6">🍬 Menú de Gomitas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-slate-400 text-sm mb-3">{product.description}</p>
              )}
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold text-emerald-400">
                  ${product.price.toLocaleString()}
                </span>
                <span className={`text-sm ${product.stock <= product.min_stock ? 'text-red-400' : 'text-slate-400'}`}>
                  Stock: {product.stock}
                </span>
              </div>
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {product.stock === 0 ? 'Agotado' : 'Agregar'}
              </button>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 h-fit sticky top-4">
          <h2 className="text-xl font-semibold text-white mb-4">🛒 Carrito</h2>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Carrito vacío</p>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center bg-slate-700 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{item.product.name}</h4>
                      <p className="text-slate-400 text-sm">
                        ${item.product.price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded"
                      >
                        -
                      </button>
                      <span className="text-white w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-600 mt-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={createOrder}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Confirmar Pedido
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
