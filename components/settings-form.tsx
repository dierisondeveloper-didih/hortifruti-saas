"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Save, Store, Phone, Truck, Loader2, Palette, ImageIcon, Upload } from "lucide-react"
import Image from "next/image"

export type TipoServico = "entrega" | "retirada" | "ambos"

export interface StoreSettings {
  id: string
  nome_loja: string
  telefone_whatsapp: string
  taxa_entrega: number
  logo_url?: string
  cor_primaria?: string
  tipo_servico?: TipoServico
}

interface SettingsFormProps {
  onSave?: () => void
}

export function SettingsForm({ onSave }: SettingsFormProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nomeLoja, setNomeLoja] = useState("")
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState("")
  const [taxaEntrega, setTaxaEntrega] = useState("")
  const [tipoServico, setTipoServico] = useState<TipoServico>("ambos")
  const [corPrimaria, setCorPrimaria] = useState("#2d8a4e")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Identifica o usuário logado PRIMEIRO
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error("Não foi possível identificar o usuário logado.")
      }

      // 2. Busca as configurações FILTRANDO pelo ID desse usuário
      const { data, error: supaError } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("dono_id", user.id) // A trava de segurança!
        .limit(1)
        .single()

      if (supaError) {
        // Se não existir, preenche com os padrões para criar no primeiro "Salvar"
        if (supaError.code === "PGRST116") {
          setSettings(null)
          setNomeLoja("Hortifruti Online")
          setTelefoneWhatsapp("")
          setTaxaEntrega("5.00")
          setTipoServico("ambos")
          setCorPrimaria("#2d8a4e")
          setLogoUrl("")
        } else {
          setError(supaError.message)
        }
      } else if (data) {
        setSettings(data as StoreSettings)
        setNomeLoja(String(data.nome_loja ?? ""))
        setTelefoneWhatsapp(String(data.telefone_whatsapp ?? ""))
        setTaxaEntrega(String(data.taxa_entrega ?? "0"))
        setTipoServico((data.tipo_servico as TipoServico) ?? "ambos")
        setCorPrimaria(String(data.cor_primaria ?? "#2d8a4e"))
        setLogoUrl(String(data.logo_url ?? ""))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!nomeLoja.trim()) {
      alert("Por favor, informe o nome da loja.")
      return
    }
    if (!telefoneWhatsapp.trim()) {
      alert("Por favor, informe o numero do WhatsApp.")
      return
    }
    
    const phoneClean = telefoneWhatsapp.replace(/\D/g, "")
    if (phoneClean.length < 10) {
      alert("O numero do WhatsApp deve ter pelo menos 10 digitos (com DDD).")
      return
    }

    setIsSaving(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Não foi possível identificar o usuário logado para salvar as configurações.")
      }

      let uploadedLogoUrl = logoUrl

      if (logoFile) {
        const timestamp = Date.now()
        const fileExt = logoFile.name.split(".").pop()
        const fileName = `logo_${timestamp}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("logos_lojas")
          .upload(fileName, logoFile, {
            contentType: logoFile.type,
            upsert: true,
          })

        if (uploadError) {
          alert("Erro no upload da logo: " + uploadError.message)
          setIsSaving(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from("logos_lojas")
          .getPublicUrl(fileName)

        if (urlData?.publicUrl) {
          uploadedLogoUrl = urlData.publicUrl
        }
      }

      const payload: any = {
        nome_loja: nomeLoja.trim(),
        telefone_whatsapp: phoneClean,
        taxa_entrega: tipoServico === "retirada" ? 0 : (parseFloat(taxaEntrega) || 0),
        tipo_servico: tipoServico,
        cor_primaria: corPrimaria,
        logo_url: uploadedLogoUrl || null,
        dono_id: user.id
      }

      if (settings?.id) {
        const { error: updateError } = await supabase
          .from("configuracoes")
          .update(payload)
          .eq("id", settings.id)

        if (updateError) {
          alert("Erro ao atualizar configuracoes: " + updateError.message)
          setIsSaving(false)
          return
        }
      } else {
        const { error: insertError } = await supabase
          .from("configuracoes")
          .insert(payload)

        if (insertError) {
          alert("Erro ao criar configuracoes: " + insertError.message)
          setIsSaving(false)
          return
        }
      }

      alert("Configuracoes salvas com sucesso!")
      await fetchSettings()
      onSave?.()
    } catch (err) {
      alert("Erro inesperado: " + (err instanceof Error ? err.message : String(err)))
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">
          Carregando configuracoes...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">
          Configuracoes da Loja
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os dados da sua loja para o catalogo e checkout
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="store-name"
            className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
          >
            <Store className="w-4 h-4 text-primary" />
            Nome da Loja
          </label>
          <input
            id="store-name"
            type="text"
            value={nomeLoja}
            onChange={(e) => setNomeLoja(e.target.value)}
            placeholder="Ex: Hortifruti do Joao"
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label
            htmlFor="whatsapp-number"
            className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
          >
            <Phone className="w-4 h-4 text-primary" />
            Numero do WhatsApp
          </label>
          <input
            id="whatsapp-number"
            type="tel"
            value={telefoneWhatsapp}
            onChange={(e) => setTelefoneWhatsapp(e.target.value)}
            placeholder="5511999999999 (com DDI e DDD)"
            className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Apenas numeros, com DDI (55) e DDD. Ex: 5511999999999
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Truck className="w-4 h-4 text-primary" />
            Tipo de Servico
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "ambos", label: "Entrega e Retirada" },
                { value: "entrega", label: "Somente Entrega" },
                { value: "retirada", label: "Somente Retirada" },
              ] as { value: TipoServico; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTipoServico(opt.value)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                  tipoServico === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Define se a loja oferece entrega, retirada ou ambas as opcoes.
          </p>
        </div>

        {tipoServico !== "retirada" && (
          <div>
            <label
              htmlFor="delivery-fee"
              className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
            >
              <Truck className="w-4 h-4 text-primary" />
              Taxa de Entrega (R$)
            </label>
            <input
              id="delivery-fee"
              type="number"
              step="0.01"
              min="0"
              value={taxaEntrega}
              onChange={(e) => setTaxaEntrega(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Valor cobrado para entregas. Use 0 para entrega gratis.
            </p>
          </div>
        )}

        <div className="border-t border-border pt-5 mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Identidade Visual (White-label)
          </h3>
        </div>

        <div>
          <label
            htmlFor="primary-color"
            className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
          >
            <Palette className="w-4 h-4 text-primary" />
            Cor Primaria da Loja
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer border border-border overflow-hidden"
              style={{ padding: 0 }}
            />
            <div className="flex-1">
              <input
                type="text"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                placeholder="#2d8a4e"
                className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>
            <div
              className="w-12 h-12 rounded-xl border border-border"
              style={{ backgroundColor: corPrimaria }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Esta cor sera aplicada no cabecalho, botoes e destaques.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Logo da Loja
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden">
              {logoPreview || logoUrl ? (
                <Image
                  src={logoPreview || logoUrl}
                  alt="Logo preview"
                  fill
                  className="object-contain p-1"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogoFile(file)
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      setLogoPreview(ev.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:bg-secondary/70 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {logoFile ? "Trocar imagem" : "Selecionar imagem"}
              </button>
              {logoFile && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {logoFile.name}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Recomendado: PNG ou SVG com fundo transparente, 200x200px.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 mt-6"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? "Salvando..." : "Salvar Configuracoes"}
        </button>
      </div>
    </div>
  )
}