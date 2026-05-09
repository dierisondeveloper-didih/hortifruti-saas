"use client"

import { useState, useMemo, useEffect } from "react"
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
  AlertCircle,
} from "lucide-react"
import type { Product } from "./product-card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
  tipoServico?: "entrega" | "retirada" | "ambos"
  donoId?: string
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
  tipoServico = "ambos",
  donoId,
  isStoreOpen = true,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState("")
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    tipoServico === "retirada" ? "pickup" : "delivery"
  )

  useEffect(() => {
    if (tipoServico === "retirada") setDeliveryType("pickup")
    else if (tipoServico === "entrega") setDeliveryType("delivery")
  }, [tipoServico])
  
  // Carrega dados do LocalStorage ao montar
  useEffect(() => {
    const savedName = localStorage.getItem("hortifruti_customer_name")
    const savedAddress = localStorage.getItem("hortifruti_customer_address")
    
    if (savedName) setCustomerName(savedName)
    if (savedAddress) {
      try {
        const addr = JSON.parse(savedAddress)
        setCep(addr.cep || "")
        setRua(addr.rua || "")
        setNumero(addr.numero || "")
        setComplemento(addr.complemento || "")
        setBairro(addr.bairro || "")
        setCidade(addr.cidade || "")
      } catch (e) {}
    }
  }, [])
  
  // Endereço Estruturado
  const [cep, setCep] = useState("")
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [rua, setRua] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    
    // Máscara 00000-000
    if (value.length > 5) {
      value = value.substring(0, 5) + "-" + value.substring(5, 8)
    }
    
    setCep(value)

    const cleanCep = value.replace("-", "")
    if (cleanCep.length === 8) {
      setIsCepLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setRua(data.logradouro || "")
          setBairro(data.bairro || "")
          setCidade(`${data.localidade || ""} - ${data.uf || ""}`)
          // Foca no número automaticamente
          document.getElementById("endereco-numero")?.focus()
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err)
      } finally {
        setIsCepLoading(false)
      }
    }
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.product.isOffer && item.product.offerPrice ? item.product.offerPrice : item.product.price
      return sum + price * item.quantity
    }, 0)
  }, [items])

  const total = useMemo(() => {
    if (deliveryType === "delivery" && deliveryFee > 0) {
      return subtotal + deliveryFee
    }
    return subtotal
  }, [subtotal, deliveryType, deliveryFee])

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleWhatsAppCheckout = async () => {
    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome.")
      return
    }
    
    let finalAddress = ""
    if (deliveryType === "delivery") {
      if (!cep.trim() || !rua.trim() || !numero.trim() || !bairro.trim() || !cidade.trim()) {
        toast.error("Preencha todos os campos obrigatórios do endereço.")
        return
      }
      finalAddress = `${rua}, ${numero}${complemento ? ` - ${complemento}` : ""} - ${bairro}, ${cidade} - CEP: ${cep}`
    }

    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.")
      return
    }

    // A NOSSA TRAVA DE SEGURANÇA:
    if (!donoId) {
      toast.error("Erro de conexão com a loja. Recarregue a página.")
      return
    }

    setIsSubmitting(true)

    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.isOffer && item.product.offerPrice ? item.product.offerPrice : item.product.price,
        unit: item.product.unit,
      }))

      // Montamos o pacote separadamente para garantir a leitura
      const payloadDoPedido = {
        cliente_nome: customerName.trim(),
        cliente_endereco: deliveryType === "delivery" ? finalAddress : null,
        tipo_entrega: deliveryType,
        total: total,
        itens: orderItems,
        status: "pendente",
        dono_id: donoId, 
      }

      const { error: insertError } = await supabase.from("pedidos").insert([payloadDoPedido])

      if (insertError) {
        toast.error("Erro ao salvar pedido: " + insertError.message)
        setIsSubmitting(false)
        return
      }

      const itemsText = items.map((item) => {
        const price = item.product.isOffer && item.product.offerPrice ? item.product.offerPrice : item.product.price
        const lineTotal = price * item.quantity
        return `${item.quantity}x ${item.product.name} (R$ ${formatPrice(lineTotal)})`
      }).join("\n")

      let message = `Olá! Gostaria de fazer um pedido:\n\n${itemsText}\n\n`
      message += `*Subtotal:* R$ ${formatPrice(subtotal)}\n`
      if (deliveryType === "delivery" && deliveryFee > 0) {
        message += `*Taxa de Entrega:* R$ ${formatPrice(deliveryFee)}\n`
      }
      message += `*Total: R$ ${formatPrice(total)}*\n\n`
      message += `*Cliente:* ${customerName}\n`
      message += `*Tipo:* ${deliveryType === "delivery" ? "Entrega" : "Retirada na Loja"}\n`
      if (deliveryType === "delivery") {
        message += `*Endereço:* ${finalAddress}\n`
      }

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")

      // Salva dados no LocalStorage para compras futuras
      localStorage.setItem("hortifruti_customer_name", customerName.trim())
      if (deliveryType === "delivery") {
        localStorage.setItem("hortifruti_customer_address", JSON.stringify({
          cep, rua, numero, complemento, bairro, cidade
        }))
      }

      if (onClearCart) onClearCart()
      toast.success("Pedido enviado com sucesso!")
      setCustomerName("")
      setCep("")
      setRua("")
      setNumero("")
      setComplemento("")
      setBairro("")
      setCidade("")
      setDeliveryType("delivery")
      onClose()
    } catch (err) {
      toast.error("Erro inesperado ao processar pedido.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: primaryColor || undefined }} />
            <h2 className="text-lg font-bold text-foreground">Seu Carrinho</h2>
            {items.length > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full" style={{ backgroundColor: primaryColor || undefined, color: primaryColor ? "#fff" : undefined }}>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70" aria-label="Fechar carrinho">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Carrinho vazio</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const price = item.product.isOffer && item.product.offerPrice ? item.product.offerPrice : item.product.price
                  return (
                    <li key={item.product.id} className="flex gap-3 p-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.product.name}</h3>
                        <p className="text-xs text-muted-foreground">R$ {formatPrice(price)}/{item.product.unit}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-semibold text-foreground w-6 text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onRemoveItem(item.product.id)} className="flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 ml-auto">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-foreground">R$ {formatPrice(price * item.quantity)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="px-4 py-3 bg-secondary/50 border-y border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium text-foreground">R$ {formatPrice(subtotal)}</span>
                </div>
                {deliveryType === "delivery" && deliveryFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de entrega</span>
                    <span className="text-sm font-medium text-foreground">R$ {formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total do pedido</span>
                  <span className="text-lg font-bold text-foreground">R$ {formatPrice(total)}</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Dados para o pedido</h3>
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-medium text-muted-foreground mb-1.5">Nome completo</label>
                  <input id="customer-name" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                {tipoServico === "retirada" ? (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Esta loja aceita apenas retirada no local</span>
                  </div>
                ) : tipoServico === "entrega" ? (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium border-transparent" style={{ backgroundColor: primaryColor || undefined, color: primaryColor ? "#fff" : undefined }}>
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>Entrega</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo de recebimento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setDeliveryType("delivery")} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${deliveryType === "delivery" ? "border-transparent" : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"}`} style={{ backgroundColor: deliveryType === "delivery" ? primaryColor || undefined : undefined, color: deliveryType === "delivery" && primaryColor ? "#fff" : undefined, borderColor: deliveryType === "delivery" ? primaryColor || undefined : undefined }}>
                        <Truck className="w-4 h-4" /> Entrega
                      </button>
                      <button type="button" onClick={() => setDeliveryType("pickup")} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${deliveryType === "pickup" ? "border-transparent" : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"}`} style={{ backgroundColor: deliveryType === "pickup" ? primaryColor || undefined : undefined, color: deliveryType === "pickup" && primaryColor ? "#fff" : undefined, borderColor: deliveryType === "pickup" ? primaryColor || undefined : undefined }}>
                        <Store className="w-4 h-4" /> Retirada
                      </button>
                    </div>
                  </div>
                )}
                {deliveryType === "delivery" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label htmlFor="endereco-cep" className="block text-xs font-medium text-muted-foreground mb-1.5">CEP</label>
                      <div className="relative">
                        <input 
                          id="endereco-cep" 
                          type="text" 
                          value={cep} 
                          onChange={handleCepChange} 
                          placeholder="00000-000" 
                          maxLength={9}
                          className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        />
                        {isCepLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endereco-rua" className="block text-xs font-medium text-muted-foreground mb-1.5">Rua</label>
                      <input id="endereco-rua" type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Sua rua" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label htmlFor="endereco-numero" className="block text-xs font-medium text-muted-foreground mb-1.5">Numero</label>
                        <input id="endereco-numero" type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="endereco-complemento" className="block text-xs font-medium text-muted-foreground mb-1.5">Complemento</label>
                        <input id="endereco-complemento" type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco, casa..." className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="endereco-bairro" className="block text-xs font-medium text-muted-foreground mb-1.5">Bairro</label>
                        <input id="endereco-bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Seu bairro" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label htmlFor="endereco-cidade" className="block text-xs font-medium text-muted-foreground mb-1.5">Cidade</label>
                        <input id="endereco-cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade" className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-card space-y-3">
            {!isStoreOpen && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium leading-tight">
                  A loja está fechada no momento. Você pode montar seu carrinho, mas a finalização via WhatsApp está desativada até o horário de abertura.
                </p>
              </div>
            )}
            <button 
              onClick={handleWhatsAppCheckout} 
              disabled={isSubmitting || !isStoreOpen} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#25D366] text-white text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
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