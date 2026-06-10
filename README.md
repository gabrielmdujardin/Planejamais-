# Planeja+ 📅

## Visão Geral

O **Planeja+** é um sistema web projetado para simplificar, organizar e centralizar todas as etapas relacionadas ao planejamento de eventos colaborativos, como confraternizações universitárias, festas familiares, churrascos entre amigos, reuniões religiosas ou viagens em grupo. Ele resolve o problema cotidiano de coordenar tarefas, confirmar presenças, dividir custos e manter informações do evento acessíveis e estruturadas em um único lugar, eliminando a necessidade de alternar entre mensagens, planilhas e anotações manuais.

## Público‑Alvo

- Estudantes que organizam festas e eventos universitários
- Famílias que planejam reuniões e celebrações
- Líderes comunitários e religiosos
- Grupos de amigos que realizam confraternizações frequentes

## Funcionalidades Principais

- **Criação e edição de eventos** com data, horário, localização e descrição
- **Gestão de convidados** com RSVP (confirmação de presença)
- **Listas de itens e responsabilidades** para tarefas operacionais
- **Divisão de custos** e rateio por participante
- **Dashboards analíticos** e visualizações de calendário interativo
- **Notificações e automações** para alertas e processos automatizados

## Stack Tecnológica

- **Frontend:** Next.js 14 com TypeScript – garante rapidez, modularidade e experiência fluida ao usuário.
- **Backend & Dados:** Supabase (PostgreSQL, autenticação, storage, eventos em tempo real).
- **Gerenciamento de Estado:** Zustand, com persistência no cliente e sincronização em tempo real.
- **Deploy & CI/CD:** (especificar fornecedor – ex.: Vercel ou Netlify) – pipelines automatizados para builds e testes.

## Arquitetura

A arquitetura foi projetada com foco em escalabilidade, segurança e manutenção fácil:
- Camada de apresentação (Next.js) consome APIs do Supabase.
- Zustands gerencia estado global e persiste dados localmente.
- Supabase oferece API RESTful e WebSockets para sincronização em tempo real.
- Possibilidade de evoluir para microsserviços e filas de mensagens para tarefas assíncronas.

## Instalação & Execução Local

```bash
# Clone o repositório
git clone https://github.com/gabrielmdujardin/Planejamais-.git
cd Planejamais-

# Instale as dependências
npm install

# Configure variáveis de ambiente (ex.: Supabase URL e KEY)
cp .env.example .env
# editar .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## Contribuindo

Contribuições são bem‑vindas! Siga os passos abaixo:
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-funcionalidade`)
3. Faça commits claros e pequenos
4. Abra um Pull Request descrevendo as mudanças

## Licença

Este projeto está licenciado sob a **MIT License** – sinta‑se à vontade para usar, modificar e distribuir.

## Roadmap Futuro

- **Microsserviços** para melhor escalabilidade
- **Fila de mensagens** (ex.: RabbitMQ) para processos assíncronos
- **Integração com pagamentos** para eventos pagos
- **IA para previsões de presença** e sugestões de listas de compras
- **Notificações push** e histórico avançado de relatórios

---

*Planeja+ – centralizando o planejamento, simplificando a execução.*
