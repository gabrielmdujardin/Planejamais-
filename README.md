# Planeja+

## Sistema de Gestão Inteligente de Eventos

O **Planeja+** é uma plataforma web desenvolvida para apoiar o planejamento, organização e acompanhamento de eventos. A solução centraliza informações sobre eventos, convidados, contatos e métricas de acompanhamento, permitindo uma visão mais estruturada e estratégica do processo de organização.

Este repositório contém o **código-fonte funcional e comentado da solução em desenvolvimento do Projeto Final de Curso**, apresentando a implementação técnica do sistema, sua organização arquitetural e os componentes responsáveis pelas principais funcionalidades da aplicação.

---

# 1. Contexto do Projeto

A organização de eventos envolve diversas atividades operacionais, como controle de convidados, acompanhamento de confirmações, gestão de contatos e análise de dados relacionados ao evento. Muitas vezes essas informações ficam distribuídas em planilhas, mensagens e diferentes ferramentas, o que dificulta o acompanhamento centralizado.

O **Planeja+** surge como uma solução para centralizar essas informações em uma única plataforma digital, permitindo maior organização, controle e visualização dos dados envolvidos no processo de planejamento de eventos.

Além da gestão operacional, a plataforma também busca oferecer **visualizações analíticas e dashboards**, auxiliando organizadores na interpretação dos dados e no acompanhamento do andamento dos eventos.

---

# 2. Objetivo Acadêmico

Este projeto foi desenvolvido como parte do **Projeto Final de Curso**, tendo como objetivo demonstrar a aplicação prática de conhecimentos relacionados a:

* desenvolvimento de aplicações web modernas
* arquitetura de software
* organização modular do código
* componentização de interfaces
* gerenciamento de estado
* integração com serviços externos
* documentação técnica de software

O repositório apresenta a solução em desenvolvimento, evidenciando a evolução do sistema ao longo das etapas do projeto.

---

# 3. Tecnologias Utilizadas

O sistema foi construído utilizando tecnologias modernas do ecossistema web.

## Frontend

* Next.js 14
* React 18
* TypeScript
* Tailwind CSS

## Componentes de Interface

* shadcn/ui
* Radix UI
* Framer Motion

## Visualização de Dados

* Recharts

## Gerenciamento de Estado

* Zustand

## Backend / Serviços

* Supabase

## Bibliotecas adicionais

* React Big Calendar
* utilitários internos do projeto

Essas tecnologias foram escolhidas por oferecerem **escalabilidade, organização do código e boa experiência de desenvolvimento**.

---

# 4. Arquitetura da Aplicação

A aplicação segue uma organização modular que separa responsabilidades entre interface, lógica da aplicação e gerenciamento de estado.

De forma simplificada, a arquitetura pode ser representada da seguinte maneira:

```
Usuário
   ↓
Interface (React / Next.js)
   ↓
Componentes reutilizáveis
   ↓
Gerenciamento de estado (Zustand)
   ↓
Serviços e integrações
   ↓
Banco de dados / backend (Supabase)
```

Essa separação permite:

* melhor organização do código
* maior reutilização de componentes
* facilidade de manutenção
* escalabilidade da aplicação

---

# 5. Estrutura do Projeto

A organizacao das pastas do projeto segue uma estrutura modular e profissional.

```
planeja-plus/
│
├── app/                      # Paginas e rotas (Next.js App Router)
│   ├── api/                  # Endpoints da API
│   │   ├── ics/             # Exportacao de calendario ICS
│   │   └── jobs/            # Endpoints de jobs/cron
│   ├── dashboard/           # Dashboard principal
│   ├── calendar/            # Visualizacao de calendario
│   ├── contacts/            # Gestao de contatos
│   ├── create-event/        # Criacao de eventos
│   ├── event/[id]/          # Detalhes do evento
│   ├── confirm-invitation/  # Confirmacao de convites (publico)
│   ├── login/               # Autenticacao
│   ├── register/            # Registro
│   ├── profile/             # Perfil do usuario
│   ├── about/               # Sobre
│   └── pricing/             # Precos
│
├── src/                      # Codigo fonte organizado
│   ├── types/               # Tipos TypeScript centralizados
│   ├── services/            # Camada de servicos (logica de negocio)
│   └── constants/           # Constantes da aplicacao
│
├── components/               # Componentes React reutilizaveis
│   ├── ui/                  # Componentes base (shadcn/ui)
│   └── charts/              # Componentes de graficos
│
├── lib/                      # Utilitarios e configuracoes
│   └── supabase/            # Cliente Supabase
│
├── hooks/                    # Custom React Hooks
├── stores/                   # Estado global (Zustand)
├── context/                  # React Context
├── jobs/                     # Background Jobs
│
├── scripts/                  # Scripts de banco de dados
│   └── migrations/          # Migracoes SQL
│
├── docs/                     # Documentacao
│   ├── technical/           # Documentacao tecnica
│   ├── DEPLOYMENT.md        # Guia de deploy
│   ├── ARCHITECTURE.md      # Arquitetura
│   ├── CONTRIBUTING.md      # Guia de contribuicao
│   └── SYSTEM.md            # Documentacao do sistema
│
├── config/                   # Configuracoes de ambiente
│   └── .env.example         # Exemplo de variaveis
│
├── public/                   # Assets estaticos
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

Essa estrutura facilita a organizacao da aplicacao e permite que novas funcionalidades sejam adicionadas de forma mais controlada.

---

# 6. Requisitos Funcionais

Entre os principais requisitos funcionais do sistema estão:

### Gestão de eventos

* criação de eventos
* edição de informações do evento
* organização de eventos por categoria ou status

### Gestão de convidados

* cadastro de convidados
* acompanhamento de confirmações
* controle de listas de convidados

### Gestão de contatos

* registro de contatos relacionados ao evento
* organização de informações de participantes

### Visualização em calendário

* visualização dos eventos em calendário
* acompanhamento de datas importantes

### Dashboard de dados

* visualização gráfica de informações
* indicadores relacionados aos eventos
* apoio à análise de dados do sistema

---

# 7. Diferenciais da Solução

Entre os principais diferenciais do Planeja+ estão:

* centralização das informações de eventos
* interface moderna e intuitiva
* visualizações analíticas para apoio à decisão
* arquitetura modular que facilita evolução do sistema
* organização do código com foco em manutenção e escalabilidade

Além disso, o projeto busca aplicar boas práticas de desenvolvimento, mantendo o código comentado e estruturado para facilitar entendimento técnico.

---

# 8. Execução do Projeto

Para executar o projeto localmente, siga os passos abaixo.

### Clonar o repositório

```
git clone https://github.com/gabrielmdujardin/Planejamais-.git
```

### Acessar a pasta

```
cd Planejamais-
```

### Instalar dependências

```
npm install
```

### Configurar variáveis de ambiente

Criar um arquivo:

```
.env.local
```

Exemplo de variáveis utilizadas:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JOBS_SECRET_TOKEN=
```

### Executar aplicação

```
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

# 9. Scripts Disponíveis

```
npm run dev
```

Inicia o servidor em ambiente de desenvolvimento.

```
npm run build
```

Gera a build de produção.

```
npm run start
```

Executa a aplicação em modo de produção.

```
npm run lint
```

Executa a análise de código.

---

# 10. Autores

Projeto desenvolvido no contexto do **Projeto Integrador / Projeto Final de Curso**.

Equipe de desenvolvimento:

* Gabriel Mendes Dujardin
* Camilla Regina Andrade
* João Paulo Arantes

---

# 11. Considerações Finais

O **Planeja+** representa uma solução em desenvolvimento voltada à gestão e organização de eventos, aplicando conceitos de arquitetura de software, desenvolvimento web moderno e organização modular de código.

O projeto permanece em evolução, podendo receber melhorias, novas funcionalidades e refinamentos ao longo das próximas etapas do desenvolvimento.

---

# Repositório

Código-fonte funcional e comentado da solução em desenvolvimento do Projeto Final de Curso **Planeja+**.
