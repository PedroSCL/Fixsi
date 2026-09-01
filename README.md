# Fixsi

Plataforma web acadêmica para aproximar clientes, prestadores de serviços e locadores de ferramentas. A aplicação permite descobrir profissionais, publicar serviços e equipamentos, conversar, negociar propostas, agendar atendimentos e avaliar a experiência.

> Este repositório contém o módulo da Fixsi sob responsabilidade desta equipe. O módulo financeiro não faz parte deste código e será desenvolvido e integrado separadamente pelos demais integrantes do grupo.

## Funcionalidades

- Cadastro e autenticação com sessões seguras em cookies HTTP-only.
- Perfis de cliente, profissional, locador e administrador.
- Catálogo e busca de serviços por texto e categoria.
- Catálogo e busca de ferramentas para locação.
- Publicação e moderação de anúncios.
- Solicitação e acompanhamento de agendamentos.
- Chat em tempo real e propostas de orçamento incorporadas à conversa.
- Confirmação da conclusão do serviço por profissional e cliente.
- Avaliações, reputação e denúncias.
- Validação de CPF no frontend e no backend.
- Interface responsiva baseada na identidade visual do protótipo da Fixsi.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Monorepo | pnpm workspaces e Turborepo |
| Frontend | Next.js 16, React 19, TypeScript e Tailwind CSS |
| Backend | Node.js, Fastify, TypeScript e Socket.IO |
| Banco de dados | PostgreSQL, Prisma ORM e adapter `pg` |
| Validação | Zod |
| Autenticação | JWT, refresh token rotativo, cookies HTTP-only e bcrypt |
| Qualidade | ESLint, Prettier, TypeScript e testes nativos do Node.js |

## Estrutura

```text
apps/
  api/       API REST, autenticação e WebSocket
  web/       aplicação Next.js
  docs/      documentação auxiliar do monorepo
packages/
  database/  schema, cliente e migrações do Prisma
  ui/        componentes compartilhados
  eslint-config/
  typescript-config/
```

## Pré-requisitos

- Node.js 18 ou superior.
- pnpm 9.
- PostgreSQL acessível localmente ou por um provedor externo.

## Configuração local

1. Clone o repositório e entre na pasta.
2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Copie `.env.example` para `.env` e preencha os valores:

   ```env
   NODE_ENV=development
   DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/fixsi?schema=public"
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   JWT_SECRET="use-um-segredo-aleatorio-com-32-ou-mais-caracteres"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

4. Gere o cliente do Prisma e aplique as migrações:

   ```bash
   pnpm --filter @fixsi/database exec prisma generate
   pnpm --filter @fixsi/database exec prisma migrate deploy
   ```

5. Inicie o projeto:

   ```bash
   pnpm dev
   ```

Por padrão, o frontend abre em `http://localhost:3000` e a API em `http://localhost:3001`.

## Comandos úteis

```bash
pnpm dev
pnpm build
pnpm test
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter api check-types
```

## Segurança

- Não publique `.env`, credenciais de banco ou segredos JWT.
- Use um `JWT_SECRET` exclusivo e forte em cada ambiente.
- Em produção, configure HTTPS e os domínios exatos em `FRONTEND_URL`.
- A autenticação usa cookies seguros e não armazena tokens no `localStorage`.
- Rotas sensíveis exigem autenticação e autorização por papel.
- Entradas são validadas no backend mesmo quando já existe validação visual no frontend.
- Senhas são armazenadas somente como hash bcrypt.

## Escopo do módulo financeiro

Este repositório não implementa cobrança, PIX, carteira, repasse ou integração com gateways. A proposta aceita inicia o atendimento e o fluxo segue até a confirmação de conclusão. A futura integração financeira deverá ser entregue como um módulo separado, com contrato de API próprio, sem acoplar credenciais ou regras financeiras a este código.

## Licença e contexto

Projeto acadêmico desenvolvido para a disciplina de Desenvolvimento de Solução Computacional. O uso, a distribuição e a integração devem seguir as decisões do grupo responsável pelo projeto.
