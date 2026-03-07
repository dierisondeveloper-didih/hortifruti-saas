"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  Store,
  MessageCircle,
} from "lucide-react"
import type { Product } from "./product-card"
import { supabase } from "@/lib/supabase"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart?: () => void
  deliveryFee?: number
  whatsappNumber?: string
  primaryColor?: string
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  deliveryFee = 0,
  whatsappNumber = "5511999999999",
  primaryColor,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState("")
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery"
  )
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price =
        item.product.isOffer && item.product.offerPrice
          ? item.product.offerPrice
          : item.product.price
      return sum + price * item.quantity
    }, 0)
  }, [items])

  // Calculate total including delivery fee if applicable
  const total = useMemo(() => {
    if (deliveryType === "delivery" && deliveryFee > 0) {
      return subtotal + deliveryFee
    }
    return subtotal
  }, [subtotal, deliveryType, deliveryFee])

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const handleWhatsAppCheckout = async () => {
    // Validation
    if (!customerName.trim()) {
      alert("Por favor, informe seu nome.")
      return
    }
    if (deliveryType === "delivery" && !address.trim()) {
      alert("Por favor, informe seu endereco para entrega.")
      return
    }
    if (items.length === 0) {
      alert("Seu carrinho esta vazio.")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare order items for JSONB storage
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price:
          item.product.isOffer && item.product.offerPrice
            ? item.product.offerPrice
            : item.product.price,
        unit: item.product.unit,
      }))

      // Insert order into database
      const { error: insertError } = await supabase.from("pedidos").insert({
        cliente_nome: customerName.trim(),
        cliente_endereco: deliveryType === "delivery" ? address.trim() : null,
        tipo_entrega: deliveryType,
        total: total,
        itens: orderItems,
        status: "pendente",
      })

      if (insertError) {
        alert("Erro ao salvar pedido: " + insertError.message)
        setIsSubmitting(false)
        return
      }

      // Build WhatsApp message
      const itemsText = items
        .map((item) => {
          const price =
            item.product.isOffer && item.product.offerPrice
              ? item.product.offerPrice
              : item.product.price
          const lineTotal = price * item.quantity
          return `${item.quantity}x ${item.product.name} (R$ ${formatPrice(lineTotal)})`
        })
        .join("\n")

      let message = `Ola! Gostaria de fazer um pedido:\n\n${itemsText}\n\n`
      message += `*Subtotal:* R$ ${formatPrice(subtotal)}\n`
      if (deliveryType === "delivery" && deliveryFee > 0) {
        message += `*Taxa de Entrega:* R$ ${formatPrice(deliveryFee)}\n`
      }
      message += `*Total: R$ ${formatPrice(total)}*\n\n`
      message += `*Cliente:* ${customerName}\n`
      message += `*Tipo:* ${deliveryType === "delivery" ? "Entrega" : "Retirada na Loja"}\n`
      if (deliveryType === "delivery") {
        message += `*Endereco:* ${address}\n`
      }

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

      // Open WhatsApp
      window.open(whatsappUrl, "_blank")

      // Clear cart after successful order
      if (onClearCart) {
        onClearCart()
      }

      // Reset form
      setCustomerName("")
      setAddress("")
      setDeliveryType("delivery")

      // Close drawer
      onClose()
    } catch (err) {
      alert(
        "Erro inesperado: " +
          (err instanceof Error ? err.message : String(err))
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag
              className="w-5 h-5"
              style={{ color: primaryColor || undefined }}
            />
            <h2 className="text-lg font-bold text-foreground">Seu Carrinho</h2>
            {items.length > 0 && (
              <span
                className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full"
                style={{
                  backgroundColor: primaryColor || undefined,
                  color: primaryColor ? "#fff" : undefined,
                }}
              >
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Carrinho vazio
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione produtos para continuar
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Cart items */}
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const price =
                    item.product.isOffer && item.product.offerPrice
                      ? item.product.offerPrice
                      : item.product.price

                  return (
                    <li
                      key={item.product.id}
                      className="flex gap-3 p-4"
                    >
                      {/* Product image */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          R$ {formatPrice(price)}/{item.product.unit}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-semibold text-foreground w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 ml-auto"
                            aria-label="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-foreground">
                          R$ {formatPrice(price * item.quantity)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Subtotal and Delivery Fee */}
              <div className="px-4 py-3 bg-secondary/50 border-y border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    R$ {formatPrice(subtotal)}
                  </span>
                </div>
                {deliveryType === "delivery" && deliveryFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Taxa de entrega
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      R$ {formatPrice(deliveryFee)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">
                    Total do pedido
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    R$ {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Checkout form */}
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Dados para o pedido
                </h3>

                {/* Name */}
                <div>
                  <label
                    htmlFor="customer-name"
                    className="block text-xs font-medium text-muted-foreground mb-1.5"
                  >
                    Nome completo
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Delivery type */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Tipo de recebimento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        deliveryType === "delivery"
                          ? "border-transparent"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                      }`}
                      style={{
                        backgroundColor: deliveryType === "delivery" ? primaryColor || undefined : undefined,
                        color: deliveryType === "delivery" && primaryColor ? "#fff" : undefined,
                        borderColor: deliveryType === "delivery" ? primaryColor || undefined : undefined,
                      }}
                    >
                      <Truck className="w-4 h-4" />
                      Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        deliveryType === "pickup"
                          ? "border-transparent"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                      }`}
                      style={{
                        backgroundColor: deliveryType === "pickup" ? primaryColor || undefined : undefined,
                        color: deliveryType === "pickup" && primaryColor ? "#fff" : undefined,
                        borderColor: deliveryType === "pickup" ? primaryColor || undefined : undefined,
                      }}
                    >
                      <Store className="w-4 h-4" />
                      Retirada
                    </button>
                  </div>
                </div>

                {/* Address (only if delivery) */}
                {deliveryType === "delivery" && (
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-xs font-medium text-muted-foreground mb-1.5"
                    >
                      Endereco completo
                    </label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, numero, bairro, cidade..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with checkout button */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <button
              onClick={handleWhatsAppCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#25D366] text-white text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar Pedido no WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  )
}
