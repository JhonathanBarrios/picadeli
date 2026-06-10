import { useState } from 'react'
import { motion } from 'motion/react'
import { Bolt, Edit2, LayoutTemplate, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import TemplateModal from '../components/TemplateModal'
import { TransactionModal } from '../components/TransactionModal'
import { useTemplates, type Template } from '../hooks/useTemplates'
import { useTransactions, type TransactionsFilters } from '../hooks/useTransactions'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '../utils/currency'
import { getLocalDateString } from '../utils/date'

export default function TemplatesPage() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates()
  const { user } = useAuthStore()

  const defaultFilters: TransactionsFilters = {
    page: 1,
    pageSize: 1,
    sortBy: 'date',
    sortOrder: 'desc',
  }
  const { createTransaction } = useTransactions(defaultFilters)

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [selectedVariableTemplate, setSelectedVariableTemplate] = useState<Template | null>(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: '',
  })
  const [quantityDialog, setQuantityDialog] = useState({
    isOpen: false,
    template: null as Template | null,
    quantity: 1,
  })

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateModal(true)
  }

  const handleSaveTemplate = async (templateData: any) => {
    if (!user?.id) return

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData)
        toast.success('Plantilla actualizada correctamente')
      } else {
        await createTemplate({
          ...templateData,
          user_id: user.id,
        })
        toast.success('Plantilla creada correctamente')
      }

      setShowTemplateModal(false)
      setEditingTemplate(null)
    } catch (error: any) {
      toast.error('Error al guardar plantilla: ' + error.message)
    }
  }

  const executeFixedTemplate = async (template: Template, quantity: number = 1) => {
    if (!user?.id) return

    try {
      // Mostrar mensaje de carga si hay más de 5 transacciones
      let toastId
      if (quantity > 5) {
        toastId = toast.loading(`Creando ${quantity} transacciones...`, { duration: Infinity })
      }

      for (let i = 0; i < quantity; i++) {
        await createTransaction({
          user_id: user.id,
          category_id: template.category_id,
          card_id: template.card_id,
          source_card_id: template.source_card_id,
          description: template.description,
          amount: template.amount,
          type: template.type,
          date: getLocalDateString(),
          notes: null,
        })
        
        // Actualizar progreso cada 5 transacciones si hay muchas
        if (quantity > 5 && (i + 1) % 5 === 0 && toastId) {
          toast.loading(`Creando ${quantity} transacciones... (${i + 1}/${quantity})`, { id: toastId, duration: Infinity })
        }
      }

      // Remover toast de carga y mostrar éxito
      if (toastId) {
        toast.dismiss(toastId)
      }
      toast.success(`${quantity} transacción(es) creada(s) desde plantilla`)
    } catch (error: any) {
      toast.error('Error al ejecutar plantilla: ' + error.message)
    }
  }

  const handleExecuteTemplate = (template: Template) => {
    if (template.is_fixed) {
      setQuantityDialog({
        isOpen: true,
        template,
        quantity: 1,
      })
      return
    }

    setSelectedVariableTemplate(template)
    setShowTransactionModal(true)
  }

  const handleDeleteTemplate = (template: Template) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          await deleteTemplate(template.id)
          toast.success('Plantilla eliminada correctamente')
        } catch (error: any) {
          toast.error('Error al eliminar plantilla: ' + error.message)
        }
      },
      title: 'Eliminar plantilla',
      message: `¿Estás seguro de eliminar "${template.name}"?`,
    })
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-white text-2xl lg:text-3xl font-bold mb-2">Plantillas</h1>
            <p className="text-slate-400 text-sm lg:text-base">Crea transacciones repetitivas en segundos</p>
          </div>
          {templates.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateTemplate}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all max-w-[200px] mx-auto sm:w-auto sm:mx-0 sm:max-w-none"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Plantilla</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando plantillas...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutTemplate className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No tienes plantillas creadas</h3>
          <p className="text-slate-400 mb-6">Crea tu primera plantilla para registrar ventas en un clic</p>
          <button
            onClick={handleCreateTemplate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Crear Plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-800/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: template.color }}>
                    <LayoutTemplate className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{template.name}</p>
                    <p className="text-slate-400 text-xs">
                      {template.is_fixed ? 'Fija' : 'Variable'} • {template.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowTemplateModal(true)
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-2">{template.description}</p>
              <p className="text-white text-xl font-bold mb-4">{formatCurrency(template.amount)}</p>

              <button
                onClick={() => handleExecuteTemplate(template)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-colors"
              >
                <Bolt className="w-4 h-4" />
                {template.is_fixed ? 'Ejecutar ahora' : 'Abrir con edición'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false)
          setEditingTemplate(null)
        }}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
      />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setSelectedVariableTemplate(null)
        }}
        prefilledType={selectedVariableTemplate?.type}
        prefilledCardId={selectedVariableTemplate?.card_id || undefined}
        prefilledData={selectedVariableTemplate ? {
          description: selectedVariableTemplate.description,
          amount: selectedVariableTemplate.amount,
          category_id: selectedVariableTemplate.category_id,
          card_id: selectedVariableTemplate.card_id,
          source_card_id: selectedVariableTemplate.source_card_id,
          type: selectedVariableTemplate.type,
        } : undefined}
        prefilledQuantity={1}
        isFromTemplate={true}
        onSuccess={() => {
          setShowTransactionModal(false)
          setSelectedVariableTemplate(null)
          toast.success('Transacción creada desde plantilla variable')
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="info"
        confirmText="Confirmar"
      />

      {/* Quantity Dialog for Fixed Templates */}
      {quantityDialog.isOpen && quantityDialog.template && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 shadow-2xl w-full max-w-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white text-xl font-semibold mb-2">Cantidad de transacciones</h3>
                <p className="text-slate-400 text-sm">
                  {quantityDialog.template.description} - {formatCurrency(quantityDialog.template.amount)}
                </p>
              </div>
              <button
                onClick={() => setQuantityDialog({ ...quantityDialog, isOpen: false })}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantityDialog.quantity}
                onChange={(e) => setQuantityDialog({ ...quantityDialog, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQuantityDialog({ ...quantityDialog, isOpen: false })}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-medium hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  executeFixedTemplate(quantityDialog.template!, quantityDialog.quantity)
                  setQuantityDialog({ ...quantityDialog, isOpen: false })
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg transition-all"
              >
                Crear {quantityDialog.quantity} transacción(es)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
