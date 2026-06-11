import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'
import { ShoppingCart, X, Plus, Power, Image as ImageIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '../utils/currency'
import imageCompression from 'browser-image-compression'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
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
  const [cartOpen, setCartOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { isAdmin } = useAuthStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*').order('name')

      // Admins see all products, vendors only see active ones
      if (!isAdmin()) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

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
    if (!product.is_active) {
      toast.error('Producto no disponible')
      return
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId)
      if (newCart.length === 0) {
        setCartOpen(false)
      }
      return newCart
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const newCart = prevCart.reduce<CartItem[]>((acc, item) => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta
          if (newQuantity > 0) {
            acc.push({ ...item, quantity: newQuantity })
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [])

      if (newCart.length === 0) {
        setCartOpen(false)
      }
      return newCart
    })
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

      setCart([])
      fetchProducts()
      toast.success(`Pedido #${String(order.order_number).padStart(6, '0')} creado exitosamente`)
    } catch (error: any) {
      toast.error('Error al crear pedido')
      console.error(error)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.8,
      }

      const compressedFile = await imageCompression(file, options)
      setImageFile(compressedFile)
    } catch (error) {
      toast.error('Error al procesar la imagen')
      console.error(error)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProduct.name || !newProduct.price) {
      toast.error('Nombre y precio son requeridos')
      return
    }

    try {
      let imageUrl: string | null = null

      // Upload image if selected
      if (imageFile) {
        setUploadingImage(true)
        imageUrl = await uploadImage(imageFile)
        setUploadingImage(false)

        if (!imageUrl) {
          toast.error('Error al subir la imagen')
          return
        }
      }

      const { error } = await supabase.from('products').insert({
        name: newProduct.name,
        description: newProduct.description || null,
        price: Number(newProduct.price),
        image_url: imageUrl,
        is_active: true,
      })

      if (error) throw error

      toast.success('Producto creado exitosamente')
      setNewProduct({ name: '', description: '', price: '' })
      setImageFile(null)
      setImagePreview(null)
      setShowCreateModal(false)
      fetchProducts()
    } catch (error: any) {
      toast.error('Error al crear producto: ' + error.message)
      setUploadingImage(false)
    }
  }

  const toggleProductActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      toast.success('Producto actualizado')
      fetchProducts()
    } catch (error: any) {
      toast.error('Error al actualizar producto: ' + error.message)
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
    <div className="relative">
      {/* Mobile Cart Toggle */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </button>
      )}

      {/* Desktop Cart Toggle */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="hidden lg:flex fixed bottom-6 right-6 z-50 items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Carrito</span>
          <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </button>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">🍬 Menú de Gomitas</h1>
          {isAdmin() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-slate-800 rounded-xl overflow-hidden border transition-colors ${
                product.is_active ? 'border-slate-700 hover:border-slate-600' : 'border-slate-800 opacity-60'
              }`}
            >
              {product.image_url && (
                <div className="w-full h-40 bg-slate-700 flex items-center justify-center p-2">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                  {isAdmin() && (
                    <button
                      onClick={() => toggleProductActive(product.id, product.is_active)}
                      className={`p-1 rounded transition-colors ${
                        product.is_active
                          ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {product.description && (
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                )}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(product.price)}
                  </span>
                  <span className={`text-sm ${product.is_active ? 'text-slate-400' : 'text-red-400'}`}>
                    {product.is_active ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.is_active}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {product.is_active ? 'Agregar' : 'Agotado'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-96 bg-slate-800 border-l border-slate-700 transform transition-transform duration-300 ease-in-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">🛒 Carrito</h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Carrito vacío</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium">{item.product.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {formatCurrency(item.product.price)} x {item.quantity}
                    </p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-semibold">Total:</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <button
                onClick={createOrder}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Confirmar Pedido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Nuevo Producto</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Imagen del Producto
                </label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        id="product-image"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-image"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                        <span className="text-slate-400 text-sm">
                          Click para subir imagen
                        </span>
                        <span className="text-slate-500 text-xs">
                          JPG, PNG, WebP (máx 1MB)
                        </span>
                      </label>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="text-center text-slate-400 text-sm">
                      Subiendo imagen...
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Precio (COP)
                </label>
                <input
                  type="text"
                  value={newProduct.price ? Number(newProduct.price).toLocaleString('es-CO') : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '')
                    setNewProduct({ ...newProduct, price: numericValue })
                  }}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
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
