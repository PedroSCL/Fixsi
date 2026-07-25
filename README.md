# Fixsi

Plataforma para encontrar e contratar profissionais, publicar serviços, alugar ferramentas, negociar pelo chat e acompanhar pagamentos.

> Projeto em desenvolvimento. A interface está em português (pt-BR).

## Funcionalidades

- Cadastro e login de clientes, profissionais e locadores.
- Catálogo público de serviços com busca e categorias.
- Publicação e administração de serviços e ferramentas.
- Solicitação de orçamento e agendamentos.
- Conversas entre cliente e prestador, com propostas.
- Avaliações, denúncias e moderação administrativa.
- Checkout PIX e processamento de eventos de pagamento via Asaas.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Axios, Lucide |
| Backend | Fastify 5, TypeScript, Zod, JWT, Socket.IO |
| Banco de dados | PostgreSQL, Prisma |
| Pagamentos | Asaas (PIX) |
| Monorepo | pnpm workspaces e Turborepo |

## Estrutura

```text
apps/
  api/          API Fastify, autenticação, pagamentos e WebSocket
  web/          Aplicação Next.js
packages/
  database/     Schema e migrations do Prisma
  ui/           Componentes compartilhados
```

## Pré-requisitos

- Node.js 18 ou superior
- pnpm 9 ou superior
- PostgreSQL 14 ou superior
- Conta sandbox do Asaas para testar pagamentos PIX

## Instalação

```bash
git clone https://github.com/SEU_USUARIO/fixsi.git
cd fixsi
pnpm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto ou configure as variáveis no ambiente de deploy.

```env
# Banco de dados
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/fixsi?schema=public"

# API
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"

# Use no mínimo 32 caracteres. Em produção, a API não inicia sem esse valor.
JWT_SECRET="troque-por-um-segredo-longo-e-aleatorio-com-32-ou-mais-caracteres"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Asaas — utilize credenciais sandbox durante o desenvolvimento
ASAAS_API_KEY="sua_chave_asaas"
ASAAS_WEBHOOK_TOKEN="um_token_longo_e_aleatorio_para_o_webhook"
```

Nunca versione arquivos `.env` ou chaves de API.

## Banco de dados

Com o PostgreSQL ativo e `DATABASE_URL` configurada:

```bash
pnpm --filter @fixsi/database exec prisma migrate dev
pnpm --filter @fixsi/database exec prisma generate
```

Para visualizar os dados localmente:

```bash
pnpm --filter @fixsi/database exec prisma studio
```

## Executando localmente

Inicie todas as aplicações do monorepo:

```bash
pnpm dev
```

Ou inicie cada aplicação em terminais separados:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

| Serviço | Endereço |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Saúde da API | http://localhost:3001/health |

## Scripts úteis

```bash
# Build de todo o monorepo
pnpm build

# Verificação de tipos do frontend
pnpm --filter web check-types

# Build da API
pnpm --filter api build

# Lint do frontend
pnpm --filter web lint
```

## Segurança

- Senhas são armazenadas com hash bcrypt.
- Rotas protegidas usam JWT e validação de autorização por usuário/papel.
- O JWT expira em 15 minutos.
- Em produção, `JWT_SECRET` é obrigatório e deve ter no mínimo 32 caracteres.
- A API aplica Helmet, CORS restrito ao `FRONTEND_URL` e limite global de requisições.
- Entradas de serviços e ferramentas são validadas e possuem limites de tamanho e paginação.

Para produção, a melhoria recomendada é migrar a sessão para cookies `HttpOnly`, `Secure` e `SameSite`, com renovação de token. Isso reduz a exposição a ataques de XSS em comparação ao armazenamento de tokens no navegador.

## Pagamentos

O projeto está configurado para o ambiente sandbox do Asaas. Antes de produção:

1. Configure credenciais de produção no provedor.
2. Cadastre o endpoint `POST /payments/webhook` no Asaas.
3. Use um `ASAAS_WEBHOOK_TOKEN` longo, aleatório e secreto.
4. Nunca exponha chaves do Asaas em variáveis `NEXT_PUBLIC_*`.

## Contribuição

1. Crie uma branch: `git checkout -b feature/minha-alteracao`.
2. Faça as alterações e valide os tipos.
3. Abra um Pull Request descrevendo contexto, mudanças e como testar.

## Licença

Defina a licença do projeto antes de disponibilizá-lo publicamente.
