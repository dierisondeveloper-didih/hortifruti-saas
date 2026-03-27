import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usamos a chave mestra para ter permissão de criar usuários silenciosamente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, nomeLoja, slug } = await request.json()

    // 1. Cria o usuário no sistema de autenticação do Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Já confirma o email automaticamente
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 2. Cria a loja atrelada a esse novo usuário
    const { data: lojaData, error: lojaError } = await supabaseAdmin
      .from('lojas')
      .insert([
        { 
          name: nomeLoja, 
          slug: slug, 
          ativo: true, 
          dono_id: userId 
        }
      ])
      .select()

    if (lojaError) {
      // Se der erro ao criar a loja (ex: slug duplicado), deletamos o usuário para não sujar o banco
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw lojaError
    }

    // 3. Cria a configuração padrão para a loja recém-criada
    const { error: configError } = await supabaseAdmin
      .from('configuracoes')
      .insert([
        {
          dono_id: userId,
          nome_loja: nomeLoja,
          telefone_whatsapp: "", // Deixa vazio para ele preencher no primeiro acesso
          taxa_entrega: 0,
          cor_primaria: "#2d8a4e" // Verde padrão
        }
      ])

    if (configError) {
      // Se der erro ao criar a configuração padrão, revertemos tudo limpando o banco
      await supabaseAdmin.from('lojas').delete().eq('dono_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw configError
    }

    // 4. Cria categorias e produtos iniciais (falha silenciosa — são conveniência, não requisito)
    try {
      const categoriasPadrao = [
        "Frutas",
        "Verduras",
        "Legumes",
        "Temperos e Ervas",
        "Raízes e Tubérculos",
        "Ovos e Laticínios",
      ]

      await supabaseAdmin
        .from("categorias")
        .insert(categoriasPadrao.map((nome) => ({ nome, dono_id: userId })))

      const produtosPadrao = [
        // Frutas
        { nome: "Banana Nanica", preco: 5.99, unidade: "kg", categoria: "Frutas" },
        { nome: "Maçã Fuji", preco: 9.99, unidade: "kg", categoria: "Frutas" },
        { nome: "Laranja Pêra", preco: 6.99, unidade: "kg", categoria: "Frutas" },
        { nome: "Manga Tommy", preco: 7.99, unidade: "kg", categoria: "Frutas" },
        { nome: "Mamão Formosa", preco: 4.99, unidade: "kg", categoria: "Frutas" },
        // Verduras
        { nome: "Alface Crespa", preco: 3.49, unidade: "un", categoria: "Verduras" },
        { nome: "Couve Manteiga", preco: 4.99, unidade: "un", categoria: "Verduras" },
        { nome: "Rúcula", preco: 4.49, unidade: "un", categoria: "Verduras" },
        { nome: "Cheiro Verde", preco: 2.99, unidade: "un", categoria: "Verduras" },
        // Legumes
        { nome: "Tomate Italiano", preco: 8.99, unidade: "kg", categoria: "Legumes" },
        { nome: "Cebola", preco: 5.99, unidade: "kg", categoria: "Legumes" },
        { nome: "Batata Lavada", preco: 6.99, unidade: "kg", categoria: "Legumes" },
        { nome: "Cenoura", preco: 5.49, unidade: "kg", categoria: "Legumes" },
        { nome: "Pimentão Verde", preco: 7.99, unidade: "kg", categoria: "Legumes" },
        // Temperos e Ervas
        { nome: "Alho", preco: 29.99, unidade: "kg", categoria: "Temperos e Ervas" },
        { nome: "Gengibre", preco: 19.99, unidade: "kg", categoria: "Temperos e Ervas" },
        { nome: "Limão Tahiti", preco: 4.99, unidade: "kg", categoria: "Temperos e Ervas" },
        // Raízes e Tubérculos
        { nome: "Mandioca", preco: 5.99, unidade: "kg", categoria: "Raízes e Tubérculos" },
        { nome: "Beterraba", preco: 6.99, unidade: "kg", categoria: "Raízes e Tubérculos" },
        { nome: "Inhame", preco: 8.99, unidade: "kg", categoria: "Raízes e Tubérculos" },
        // Ovos e Laticínios
        { nome: "Ovos Caipira (dúzia)", preco: 14.99, unidade: "un", categoria: "Ovos e Laticínios" },
        { nome: "Queijo Minas Frescal", preco: 34.99, unidade: "kg", categoria: "Ovos e Laticínios" },
      ]

      await supabaseAdmin
        .from("produtos")
        .insert(
          produtosPadrao.map((p) => ({
            ...p,
            dono_id: userId,
            estoque: 0,
            em_oferta: false,
            imagem_url: null,
          }))
        )
    } catch (seedError) {
      console.error("Erro ao criar dados iniciais (não crítico):", seedError)
    }

    return NextResponse.json({ success: true, loja: lojaData[0] })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}