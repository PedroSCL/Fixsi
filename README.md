# Serveo

**Encontre profissionais. Contrate com confiança.**

A Serveo é uma plataforma em português para contratar serviços, alugar ferramentas, negociar propostas e acompanhar todo o atendimento em um só lugar. Clientes, profissionais e locadores usam fluxos próprios, com chat em tempo real, agendamentos, reputação e pagamento PIX.

> Projeto em desenvolvimento. As integrações financeiras devem ser testadas primeiro no ambiente sandbox.

## Principais recursos

- Cadastro e login para clientes, profissionais e locadores.
- Catálogo pesquisável de profissionais e serviços.
- Catálogo de ferramentas disponíveis para aluguel.
- Publicação de serviços e ferramentas.
- Solicitação de orçamento e agendamento por data.
- Chat em tempo real e envio de propostas.
- Checkout PIX integrado ao Asaas.
- Avaliações bilaterais após a conclusão do pedido.
- Denúncias e painel de moderação para administradores.
- Interface responsiva com identidade visual própria da Serveo.

## Tecnologias

| Camada     | Tecnologias                                                   |
| ---------- | ------------------------------------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS, Axios, Lucide |
| Backend    | Fastify 5, TypeScript, Zod, JWT, Socket.IO                    |
| Dados      | PostgreSQL e Prisma                                           |
| Pagamentos | Asaas (PIX)                                                   |
| Monorepo   | pnpm workspaces e Turborepo                                   |

## Estrutura do repositório

```text
apps/
  api/          API REST, autenticação, pagamentos e WebSocket
  web/          Aplicação web Next.js
packages/
  database/     Schema, cliente e migrations do Prisma
  ui/           Componentes compartilháveis do monorepo
```

## Pré-requisitos

- Node.js 18 ou superior
- pnpm 9 ou superior
- PostgreSQL 14 ou superior
- Conta sandbox do Asaas para testar pagamentos

## Instalação

```bash
git clone URL_DO_REPOSITORIO
cd fixsi
pnpm install
```

O nome da pasta e alguns identificadores internos ainda usam `fixsi` para manter compatibilidade técnica. A marca apresentada ao usuário é **Serveo**.

## Variáveis de ambiente

Crie o arquivo `.env` esperado pelo ambiente local sem versioná-lo:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/serveo?schema=public"

NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="use-um-segredo-aleatorio-com-pelo-menos-32-caracteres"

NEXT_PUBLIC_API_URL="http://localhost:3001"

ASAAS_API_KEY="sua_chave_sandbox"
ASAAS_WEBHOOK_TOKEN="um-token-de-webhook-longo-e-aleatorio"
```

Nunca publique `.env`, credenciais do banco, chaves Asaas ou segredos JWT.

## Banco de dados

Com o PostgreSQL ativo:

```bash
pnpm --filter @fixsi/database exec prisma generate
pnpm --filter @fixsi/database exec prisma migrate dev
```

Para inspecionar os dados localmente:

```bash
pnpm --filter @fixsi/database exec prisma studio
```

## Desenvolvimento local

Inicie o monorepo:

```bash
pnpm dev
```

Ou execute as aplicações separadamente:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

| Serviço       | Endereço                     |
| ------------- | ---------------------------- |
| Aplicação web | http://localhost:3000        |
| API           | http://localhost:3001        |
| Saúde da API  | http://localhost:3001/health |

## Validação

```bash
# Tipos e rotas geradas do frontend
pnpm --filter web check-types

# Lint do frontend
pnpm --filter web lint

# Build da API
pnpm --filter api build

# Build completo
pnpm build
```

## Segurança

- Senhas são protegidas com bcrypt.
- Rotas privadas exigem JWT e verificam o usuário ou papel autorizado.
- Tokens têm expiração curta; em produção, `JWT_SECRET` é obrigatório e deve ter ao menos 32 caracteres.
- A API usa Helmet, limitação de requisições e CORS restrito ao `FRONTEND_URL`.
- Entradas importantes são validadas com Zod e possuem limites.
- O webhook de pagamento valida `ASAAS_WEBHOOK_TOKEN`.
- E-mail e CPF não são alterados pela tela de perfil.

Antes de publicar em produção, migre a sessão para cookies `HttpOnly`, `Secure` e `SameSite`, com fluxo de renovação e revogação de sessão. O armazenamento atual no navegador foi mantido para não quebrar a aplicação existente, mas não é a configuração final recomendada.

## Pagamentos

1. Use credenciais sandbox durante o desenvolvimento.
2. Cadastre `POST /payments/webhook` no painel do Asaas.
3. Defina um token exclusivo para o webhook.
4. Nunca coloque chaves privadas em variáveis `NEXT_PUBLIC_*`.
5. Valide o fluxo completo de criação, confirmação e liberação antes de habilitar produção.

## Contribuição

1. Crie uma branch a partir da versão mais recente.
2. Faça mudanças pequenas e documentadas.
3. Execute tipos, lint e build.
4. Abra um Pull Request explicando o contexto e como testar.

## Licença

Defina uma licença antes de disponibilizar o projeto publicamente.
