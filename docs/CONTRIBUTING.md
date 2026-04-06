# Guia de Contribuicao - Planeja+

Este documento descreve as diretrizes para contribuir com o projeto Planeja+.

## Estrutura do Projeto

```
planeja-plus/
├── app/                    # Paginas e rotas (Next.js App Router)
│   ├── api/               # Endpoints da API
│   ├── (auth)/            # Rotas autenticadas
│   └── (public)/          # Rotas publicas
├── src/                   # Codigo fonte organizado
│   ├── components/        # Componentes React
│   ├── services/          # Logica de negocio
│   ├── hooks/             # Custom hooks
│   ├── stores/            # Estado global (Zustand)
│   ├── types/             # Tipos TypeScript
│   └── constants/         # Constantes
├── lib/                   # Utilitarios e configuracoes
├── jobs/                  # Background jobs
├── scripts/               # Scripts de banco de dados
│   └── migrations/        # Migracoes SQL
├── docs/                  # Documentacao
│   └── technical/         # Docs tecnicos
├── config/                # Configuracoes de ambiente
└── public/                # Assets estaticos
```

## Convencoes de Codigo

### Nomenclatura

- **Arquivos**: kebab-case (ex: `event-card.tsx`)
- **Componentes**: PascalCase (ex: `EventCard`)
- **Funcoes**: camelCase (ex: `handleSubmit`)
- **Constantes**: SCREAMING_SNAKE_CASE (ex: `MAX_GUESTS`)
- **Tipos/Interfaces**: PascalCase com sufixo descritivo (ex: `EventType`, `UserProps`)

### Estrutura de Componentes

```tsx
// 1. Imports
import { useState } from "react"
import { Button } from "@/components/ui/button"

// 2. Types/Interfaces
interface EventCardProps {
  title: string
  date: string
}

// 3. Component
export function EventCard({ title, date }: EventCardProps) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false)

  // 3.2 Handlers
  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  // 3.3 Render
  return (
    <div>
      <h2>{title}</h2>
      <p>{date}</p>
    </div>
  )
}
```

### Commits

Use commits semanticos:

- `feat:` nova funcionalidade
- `fix:` correcao de bug
- `docs:` documentacao
- `style:` formatacao
- `refactor:` refatoracao
- `test:` testes
- `chore:` manutencao

Exemplo:
```
feat: adiciona filtro de eventos por tipo
fix: corrige erro de validacao no formulario de convidados
docs: atualiza README com instrucoes de deploy
```

## Fluxo de Desenvolvimento

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. Desenvolva e teste localmente:
   ```bash
   npm run dev
   npm run lint
   ```

3. Commit suas alteracoes seguindo as convencoes

4. Abra um Pull Request para `main`

5. Aguarde revisao e aprovacao

## Testes

Execute os testes antes de abrir PRs:

```bash
npm run test        # Testes unitarios
npm run test:e2e    # Testes end-to-end (se disponiveis)
```

## Boas Praticas

- Mantenha componentes pequenos e focados
- Use TypeScript para todos os arquivos
- Documente funcoes complexas com JSDoc
- Evite `any` - use tipos especificos
- Prefira composicao a heranca
- Siga os padroes existentes no codigo
