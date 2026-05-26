# 🚀 Guia de Deploy - Planeja+

Este guia detalha o processo completo de deploy da aplicação Planeja+ no Vercel.

## 📋 Pré-requisitos

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Supabase](https://supabase.com) (opcional)
- [ ] Node.js 18+ instalado
- [ ] Git configurado

## 🛠️ Preparação

### 1. Instalar Vercel CLI

\`\`\`bash
npm install -g vercel
\`\`\`

### 2. Fazer Login

\`\`\`bash
vercel login
\`\`\`

Escolha o método de autenticação (GitHub, GitLab, Bitbucket, ou Email).

## 🌐 Deploy em Produção

### Método 1: Via CLI (Recomendado)

\`\`\`bash
# No diretório do projeto
vercel --prod
\`\`\`

O CLI irá:
1. Fazer build da aplicação
2. Otimizar os assets
3. Fazer upload para o Vercel
4. Fornecer a URL de produção

### Método 2: Via GitHub

1. **Push para GitHub**
\`\`\`bash
git add .
git commit -m "Deploy to production"
git push origin main
\`\`\`

2. **Conectar ao Vercel**
- Acesse [vercel.com/new](https://vercel.com/new)
- Clique em "Import Project"
- Selecione o repositório
- Configure as variáveis de ambiente
- Clique em "Deploy"

## ⚙️ Configuração de Variáveis de Ambiente

### No Vercel Dashboard

1. Acesse o projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

\`\`\`bash
# Supabase (se estiver usando)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada

# Database (Vercel Postgres)
POSTGRES_URL=sua-url-do-postgres
POSTGRES_PRISMA_URL=sua-url-prisma
POSTGRES_URL_NON_POOLING=sua-url-non-pooling
POSTGRES_USER=seu-usuario
POSTGRES_HOST=seu-host
POSTGRES_PASSWORD=sua-senha
POSTGRES_DATABASE=seu-database

# Jobs
JOBS_SECRET_TOKEN=seu-token-secreto
\`\`\`

### Via CLI

\`\`\`bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... adicione todas as outras
\`\`\`

## 🔄 Cron Jobs (Opcional)

O projeto inclui cron jobs configurados no `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/jobs/daily-aggregate",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/jobs/pending-invites",
      "schedule": "0 9,15 * * *"
    }
  ]
}
\`\`\`

**Atenção**: Cron jobs requerem um plano Vercel Pro ou superior.

## 🎯 Domínio Customizado

### Adicionar Domínio

1. No dashboard do Vercel, vá em **Settings** > **Domains**
2. Clique em "Add Domain"
3. Digite seu domínio (ex: `planeja.app`)
4. Siga as instruções para configurar DNS

### Configuração DNS

Adicione os seguintes registros no seu provedor DNS:

\`\`\`
Tipo  | Nome | Valor
------|------|------------------
A     | @    | 76.76.21.21
CNAME | www  | cname.vercel-dns.com
\`\`\`

## 📊 Monitoramento

### Analytics

Habilite o Vercel Analytics:

1. Vá em **Analytics**
2. Clique em "Enable Analytics"
3. Adicione ao código:

\`\`\`tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
\`\`\`

### Logs

Visualize logs em tempo real:

\`\`\`bash
vercel logs --follow
\`\`\`

## 🔧 Troubleshooting

### Build Falha

\`\`\`bash
# Limpe o cache e rebuilde
vercel --force

# Verifique os logs
vercel logs
\`\`\`

### Erro de Variáveis de Ambiente

\`\`\`bash
# Liste as variáveis configuradas
vercel env ls

# Remova e adicione novamente
vercel env rm NOME_DA_VARIAVEL
vercel env add NOME_DA_VARIAVEL
\`\`\`

### Erro de Build do Next.js

Verifique o `next.config.js`:

\`\`\`javascript
module.exports = {
  typescript: {
    ignoreBuildErrors: true, // Temporário
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporário
  },
}
\`\`\`

## 🚀 Deploy Automático

Configure deploy automático via GitHub:

1. No Vercel, vá em **Settings** > **Git**
2. Configure os branches:
   - `main` → Produção
   - `develop` → Preview
3. Habilite "Deploy on push"

## 📈 Otimizações

### 1. Edge Functions

Mova funções para Edge para melhor performance:

\`\`\`typescript
export const config = {
  runtime: 'edge',
}
\`\`\`

### 2. Image Optimization

Configure domínios de imagem no `next.config.js`:

\`\`\`javascript
module.exports = {
  images: {
    domains: ['images.unsplash.com', 'seu-dominio.com'],
  },
}
\`\`\`

### 3. Caching

Configure headers de cache:

\`\`\`javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate',
          },
        ],
      },
    ]
  },
}
\`\`\`

## ✅ Checklist Pré-Deploy

- [ ] Todos os testes passando
- [ ] Build local funcionando (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] .gitignore atualizado
- [ ] README.md documentado
- [ ] Removido console.logs desnecessários
- [ ] Otimizado imagens
- [ ] Configurado domínio customizado (opcional)
- [ ] Analytics configurado (opcional)

## 🎉 Deploy Completo!

Após o deploy:

1. Teste a aplicação em produção
2. Verifique as métricas de performance
3. Configure alertas (opcional)
4. Monitore os logs

URL de produção: `https://seu-projeto.vercel.app`

---

**Suporte**: Em caso de problemas, consulte a [documentação oficial do Vercel](https://vercel.com/docs)
