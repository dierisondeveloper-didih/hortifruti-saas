# Documentação Técnica - Hortifruti App

## 📝 Visão Geral
SaaS multi-tenant para hortifrutis. Cada lojista tem seu catálogo em `/[slug]`, gerencia produtos/pedidos em `/admin` e os clientes finalizam pedidos via WhatsApp.

## 🚀 Funcionalidades Principais
- **Catálogo Multi-tenant:** Identificação automática da loja via URL.
- **Vídeos de Frescor:** Gravação de vídeos curtos (max 15s) para mostrar a qualidade dos produtos.
- **Dashboard Admin:** Métricas de faturamento, pedidos pendentes e produtos mais vendidos.
- **Gestão de Produtos/Categorias:** CRUD completo com upload de imagens para o Supabase Storage.
- **Checkout WhatsApp:** Mensagem estruturada com itens, subtotal, taxa de entrega e dados do cliente.
- **Pagamento Pix:** Exibição de chave Pix e botão "Copiar" no carrinho.
- **Gestão de Pedidos:** Baixa automática de estoque e atualização de status em tempo real.

## 🛠 Alterações Recentes (Fixes e Melhorias)
1. **Fix de Referência (CategoryManagement):** Corrigido erro onde `deleteConfirm` não estava definido, quebrando a página de categorias.
2. **Melhoria no Resumo WhatsApp:** Mensagem formatada com emojis, separadores e informações claras para separação rápida.
3. **TypeScript Audit:** Resolvidos erros críticos em `AdminDashboard` (cálculo de Top Produtos), `OrdersManagement` (exclusão de pedidos) e `ProductFormModal` (toast faltante).
4. **Persistência de Ofertas:** Corrigido bug onde produtos em oferta não salvavam o status ou preço promocional ao serem criados.
5. **Dashboard Premium:** Visual atualizado com gráficos de área e listagem dos 5 produtos mais vendidos da semana.
6. **Limpeza de Projeto:** Remoção de scripts SQL de migração já aplicados e códigos de debug.

## 🔍 Onde mexer? (Guia de Manutenção)

### Se houver bugs no Catálogo:
- `app/[slug]/page.tsx`: Lógica de carregamento de dados e filtros.
- `components/cart-drawer.tsx`: Lógica do carrinho e formatação da mensagem do WhatsApp.
- `components/product-card.tsx`: Renderização do card, vídeos e badges.

### Se houver bugs no Admin:
- `app/admin/page.tsx`: Orquestração das abas e autenticação.
- `components/orders-management.tsx`: Lógica de status de pedidos e integração com banco.
- `components/product-management.tsx`: Gestão da lista de produtos.
- `components/admin-dashboard.tsx`: Cálculos de métricas e gráficos.

### Lógica de Negócio e Utilidades:
- `lib/product-utils.ts`: Formatação de datas de frescor e fallback de imagens.
- `lib/supabase.ts`: Configuração do cliente Supabase.

## ⚠️ Pontos de Atenção Futuros
- **RLS no Supabase:** Atualmente a segurança é feita via código (`.eq("dono_id", user.id)`). Implementar RLS é o próximo passo de segurança.
- **Integração de Pagamento:** O sistema está pronto para receber gateways (Mercado Pago/Asaas) no futuro.
- **Notificações:** O sistema usa Toasts e Realtime para novos pedidos, mas notificações push ou SMS/WhatsApp direto seriam boas adições.
