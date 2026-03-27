"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Loader2,
  Package,
  Truck,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
} from "lucide-react"

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  unit: string
}

interface Order {
  id: string
  cliente_nome: string
  cliente_endereco: string | null
  tipo_entrega: "delivery" | "pickup"
  total: number
  itens: OrderItem[]
  status: "pendente" | "concluido" | "cancelado"
  created_at: string
}

const STATUS_CONFIG = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
  },
  concluido: {
    label: "Concluido",
    icon: CheckCircle,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
  },
}

interface OrdersManagementProps {
  onStockChange?: () => void
}

export function OrdersManagement({ onStockChange }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [tipoServico, setTipoServico] = useState<"entrega" | "retirada" | "ambos">("ambos")
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: configData } = await supabase
      .from("configuracoes")
      .select("tipo_servico")
      .eq("dono_id", user.id)
      .limit(1)
      .maybeSingle()

    setTipoServico((configData?.tipo_servico as "entrega" | "retirada" | "ambos") ?? "ambos")

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("dono_id", user.id) // TRAVA DE SEGURANÇA
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar pedidos:", error)
      setOrders([])
    } else {
      setOrders(
        (data ?? []).map((row) => ({
          id: String(row.id),
          cliente_nome: String(row.cliente_nome ?? ""),
          cliente_endereco: row.cliente_endereco
            ? String(row.cliente_endereco)
            : null,
          tipo_entrega: row.tipo_entrega === "pickup" ? "pickup" : "delivery",
          total: Number(row.total ?? 0),
          itens: Array.isArray(row.itens) ? row.itens : [],
          status: ["pendente", "concluido", "cancelado"].includes(row.status)
            ? row.status
            : "pendente",
          created_at: String(row.created_at ?? ""),
        }))
      )
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = async (
    orderId: string,
    newStatus: "pendente" | "concluido" | "cancelado"
  ) => {
    setUpdatingStatus(orderId)

    try {
      // Find the order to get current status and items
      const order = orders.find((o) => o.id === orderId)
      if (!order) {
        alert("Pedido nao encontrado")
        setUpdatingStatus(null)
        return
      }

      const oldStatus = order.status
      const items = order.itens

      // Determine if we need to adjust stock
      // Deduct stock: when changing TO "concluido" from non-concluido
      // Restore stock: when changing FROM "concluido" to non-concluido
      const shouldDeductStock = newStatus === "concluido" && oldStatus !== "concluido"
      const shouldRestoreStock = oldStatus === "concluido" && newStatus !== "concluido"

      // Process stock adjustments
      if (shouldDeductStock || shouldRestoreStock) {
        for (const item of items) {
          // Get current stock
          const { data: productData, error: fetchError } = await supabase
            .from("produtos")
            .select("estoque")
            .eq("id", item.product_id)
            .single()

          if (fetchError) {
            console.error(`Erro ao buscar estoque do produto ${item.product_id}:`, fetchError)
            continue // Skip this item but continue with others
          }

          const currentStock = Number(productData?.estoque ?? 0)
          let newStock: number

          if (shouldDeductStock) {
            // Deduct stock (baixa)
            newStock = Math.max(0, currentStock - item.quantity)
          } else {
            // Restore stock (estorno)
            newStock = currentStock + item.quantity
          }

          // Update stock in database
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          const { error: updateError } = await supabase
            .from("produtos")
            .update({ estoque: newStock })
            .eq("id", item.product_id)
            .eq("dono_id", currentUser?.id) // TRAVA DE SEGURANÇA

          if (updateError) {
            console.error(`Erro ao atualizar estoque do produto ${item.product_id}:`, updateError)
          }
        }
      }

      // Update order status
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("pedidos")
        .update({ status: newStatus })
        .eq("id", orderId)
        .eq("dono_id", authUser?.id) // TRAVA DE SEGURANÇA

      if (error) {
        alert("Erro ao atualizar status: " + error.message)
      } else {
        // Show success message with stock info
        if (shouldDeductStock) {
          alert("Status atualizado e estoque baixado!")
        } else if (shouldRestoreStock) {
          alert("Status atualizado e estoque estornado!")
        } else {
          alert("Status atualizado com sucesso!")
        }
        await fetchOrders()

        // Notify parent to refresh products list (for stock reactivity)
        if (onStockChange && (shouldDeductStock || shouldRestoreStock)) {
          onStockChange()
        }
      }
    } catch (err) {
      alert(
        "Erro inesperado: " +
          (err instanceof Error ? err.message : String(err))
      )
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este pedido?")
    if (!confirmed) return

    setDeletingOrder(orderId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", orderId)
        .eq("dono_id", user.id) // TRAVA DE SEGURANÇA

      if (error) {
        alert("Erro ao excluir pedido: " + error.message)
      } else {
        await fetchOrders()
      }
    } catch (err) {
      alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDeletingOrder(null)
    }
  }

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Dashboard de Pedidos
          </h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} encontrado
            {orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Aviso de retirada */}
      {tipoServico === "retirada" && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-700">
          <Store className="w-4 h-4 shrink-0" />
          <span>Esta loja opera apenas com retirada no local</span>
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nenhum pedido encontrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os pedidos aparecerao aqui quando os clientes comprarem
          </p>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-3">
        {orders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status]
          const StatusIcon = statusConfig.icon
          const isExpanded = expandedOrder === order.id
          const isUpdating = updatingStatus === order.id

          return (
            <div
              key={order.id}
              className="rounded-2xl bg-card border border-border overflow-hidden"
            >
              {/* Order header */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {order.cliente_nome}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {order.tipo_entrega === "delivery" ? (
                        <Truck className="w-3 h-3" />
                      ) : (
                        <Store className="w-3 h-3" />
                      )}
                      {order.tipo_entrega === "delivery"
                        ? "Entrega"
                        : "Retirada"}
                    </span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">
                    R$ {formatPrice(order.total)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4 bg-secondary/20">
                  {/* Address */}
                  {order.cliente_endereco && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Endereco de entrega
                      </p>
                      <p className="text-sm text-foreground">
                        {order.cliente_endereco}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Itens do pedido
                    </p>
                    <ul className="space-y-1.5">
                      {order.itens.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="text-muted-foreground">
                            R$ {formatPrice(item.unit_price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status actions */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Alterar status
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {order.status !== "pendente" && (
                        <button
                          onClick={() =>
                            handleStatusChange(order.id, "pendente")
                          }
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-100 text-yellow-700 text-xs font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          Pendente
                        </button>
                      )}
                      {order.status !== "concluido" && (
                        <button
                          onClick={() =>
                            handleStatusChange(order.id, "concluido")
                          }
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Concluido
                        </button>
                      )}
                      {order.status !== "cancelado" && (
                        <button
                          onClick={() =>
                            handleStatusChange(order.id, "cancelado")
                          }
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Cancelado
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deletingOrder === order.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        title="Excluir pedido"
                      >
                        {deletingOrder === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
