# Planeja+ 🎉

Plataforma completa de gestão de eventos com análise de dados e dashboards interativos.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Visualização de dados
- **Zustand** - Gerenciamento de estado
- **Supabase** - Backend e autenticação
- **React Big Calendar** - Calendário de eventos
- **Framer Motion** - Animações


# Entre no diretório
cd planeja-plus

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
\`\`\`

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🌐 Deploy no Vercel

### Opção 1: Deploy via CLI

\`\`\`bash
# Instale a CLI do Vercel
npm i -g vercel

# Faça login
vercel login

# Deploy em produção
vercel --prod
\`\`\`

### Opção 2: Deploy via GitHub

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Importe o repositório
5. Configure as variáveis de ambiente
6. Clique em "Deploy"

## 🔑 Variáveis de Ambiente

Configure as seguintes variáveis no Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave privada do Supabase
- `JOBS_SECRET_TOKEN` - Token para autenticação de cron jobs

## 📊 Funcionalidades

### Dashboard Interativo
- ✅ Análise de eventos por tipo
- ✅ Análise de eventos por categoria
- ✅ Análise de eventos por status
- ✅ Distribuição de convidados
- ✅ Evolução mensal
- ✅ Taxa de confirmação

### Gestão de Eventos
- ✅ Criar e editar eventos
- ✅ Gerenciar convidados
- ✅ Enviar convites
- ✅ Controlar confirmações
- ✅ Calendário interativo

### Qualidade de Dados
- ✅ Análise de completude
- ✅ Análise de consistência
- ✅ Análise de integridade
- ✅ Análise de validade
- ✅ Detecção de duplicatas

### Testes de Usuário
- ✅ Simulação de perfis
- ✅ Cenários de teste
- ✅ Métricas de usabilidade
- ✅ Análise de feedback

## 📁 Estrutura do Projeto

\`\`\`
planeja-plus/
├── app/                      # Páginas Next.js (App Router)
│   ├── dashboard/           # Dashboard e análises
│   ├── calendar/            # Calendário de eventos
│   ├── contacts/            # Gestão de contatos
│   └── create-event/        # Criar eventos
├── components/              # Componentes React
│   ├── ui/                  # Componentes shadcn/ui
│   └── [outros]             # Componentes customizados
├── stores/                  # Estados Zustand
├── lib/                     # Utilidades e helpers
└── public/                  # Arquivos estáticos
\`\`\`

## 🎨 Design System

- **Cores Primárias**: Verde Esmeralda (#10b981)
- **Tipografia**: System UI, sans-serif
- **Espaçamento**: Baseado em múltiplos de 4px
- **Border Radius**: 8px padrão
- **Modo Escuro**: Suportado nativamente

## 📈 Métricas de Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

## 🧪 Testes

\`\`\`bash
# Executar testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar linter
npm run lint
\`\`\`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Equipe Planeja+** - [GitHub](https://github.com/planeja-plus)

## 🙏 Agradecimentos

- [Vercel](https://vercel.com) - Hospedagem e deployment
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Recharts](https://recharts.org) - Biblioteca de gráficos

---

Feito com ❤️ pela equipe Planeja+
