# Fixsi

Plataforma web acadêmica que aproxima clientes de profissionais para contratação de serviços e locação de ferramentas. A Fixsi permite publicar anúncios, consultar disponibilidade, solicitar um atendimento, conversar em tempo real, negociar valores e acompanhar o agendamento até a conclusão.

> Esta versão não possui gateway de pagamento ativo. O fluxo financeiro foi deixado fora do escopo atual para ser desenvolvido em etapa posterior.

## Links do projeto

- Aplicação web: [fixsi-web-nbvh.vercel.app](https://fixsi-web-nbvh.vercel.app/)
- API: [fixsi-api.onrender.com/health](https://fixsi-api.onrender.com/health)
- Repositório: [PedroSCL/Fixsi](https://github.com/PedroSCL/Fixsi)

> O plano gratuito do Render pode pausar a API após inatividade. Nesse caso, o primeiro acesso pode levar alguns segundos.

## Principais funcionalidades

### Usuários e segurança

- Cadastro de cliente ou profissional; profissionais também podem contratar serviços como clientes.
- Perfis de **Cliente**, **Profissional** e **Administrador**.
- Login com sessões armazenadas em cookies HTTP-only.
- Renovação de sessão com refresh token rotativo.
- Recuperação de senha por e-mail usando a API do Brevo.
- Validação de CPF e telefone brasileiro no frontend e no backend.
- Edição de perfil, alteração de tipo de conta e exclusão segura da conta.

### Serviços, ferramentas e agenda

- Busca de serviços por texto e categoria.
- Busca de ferramentas disponíveis para locação.
- Publicação imediata de anúncios de serviços e ferramentas.
- Imagem opcional por URL, com ilustração padrão quando não há imagem.
- Área **Meus anúncios** para o profissional editar ou retirar seus próprios anúncios.
- Disponibilidade semanal e exceções por data para profissionais.
- Cliente vê dias disponíveis antes de solicitar o serviço.

### Conversas, propostas e acompanhamento

- Solicitação de serviço cria um agendamento e uma conversa entre cliente e profissional.
- Chat em tempo real com Socket.IO.
- Indicador de mensagens não lidas na navegação.
- Propostas e contrapropostas de valor dentro da conversa.
- Aceite ou recusa de proposta.
- Acompanhamento dos agendamentos pelas duas partes.
- Conclusão do atendimento e avaliações obrigatórias entre cliente e profissional.

### Administração

- Painel administrativo protegido por papel.
- Consulta de denúncias abertas.
- Edição e desativação de qualquer anúncio do site.
- Desativação mantém o histórico de pedidos, mas remove o anúncio da vitrine pública.

## Tecnologias

| Camada | Tecnologias e serviços |
| --- | --- |
| Monorepo | pnpm Workspaces e Turborepo |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Axios e Lucide |
| Backend | Node.js, Fastify, TypeScript e Socket.IO |
| Banco de dados | PostgreSQL hospedado no Neon |
| ORM e migrações | Prisma ORM com adapter PostgreSQL |
| Autenticação | JWT, cookies HTTP-only, refresh token rotativo e bcrypt |
| Validação | Zod |
| E-mail | Brevo API |
| Deploy | Vercel (web) e Render (API) |

## Arquitetura

~~~text
Navegador
   │
   ├── Vercel / Next.js (apps/web)
   │       └── /api/* é encaminhado para a API
   │
   └── Render / Fastify (apps/api)
           ├── API REST
           ├── Socket.IO
           ├── Brevo (recuperação de senha)
           └── Prisma
                    │
                    └── Neon / PostgreSQL
~~~

O frontend usa chamadas na mesma origem (**/api**) para reduzir problemas de cookies, CORS e navegação móvel. A API é responsável pelas regras de autorização; esconder um botão na interface não substitui a validação feita no servidor.

## Estrutura do repositório

~~~text
apps/
  api/                API Fastify, autenticação, Socket.IO e regras de negócio
  web/                Aplicação Next.js
packages/
  database/           Schema, cliente e migrações do Prisma
  ui/                 Componentes compartilhados
  eslint-config/      Configuração compartilhada do ESLint
  typescript-config/  Configurações compartilhadas do TypeScript
docs/
  diagrams/           Diagramas do projeto
~~~

## Pré-requisitos

- Node.js 18 ou superior.
- pnpm 9 ou superior.
- Um banco PostgreSQL acessível. Para o ambiente publicado, o projeto utiliza Neon.

## Executando localmente

1. Clone o repositório e entre na pasta:

~~~bash
git clone https://github.com/PedroSCL/Fixsi.git
cd Fixsi
~~~

2. Instale as dependências:

~~~bash
pnpm install
~~~

3. Crie os arquivos de ambiente a partir do modelo:

~~~bash
cp .env.example apps/api/.env
cp .env.example packages/database/.env
printf "API_URL=http://localhost:3001\n" > apps/web/.env.local
~~~

No Windows PowerShell:

~~~powershell
Copy-Item .env.example apps/api/.env
Copy-Item .env.example packages/database/.env
Set-Content apps/web/.env.local 'API_URL=http://localhost:3001'
~~~

4. Preencha **apps/api/.env** com as variáveis da API. Para comandos do Prisma, mantenha também a **DATABASE_URL** em **packages/database/.env**. O arquivo **apps/web/.env.local** informa ao Next.js onde a API está rodando.

5. Gere o cliente Prisma e aplique as migrações:

~~~bash
pnpm --filter @fixsi/database exec prisma generate
pnpm --filter @fixsi/database exec prisma migrate deploy
~~~

6. Inicie frontend e backend:

~~~bash
pnpm dev
~~~

Por padrão:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Saúde da API: http://localhost:3001/health

## Variáveis de ambiente

Use o arquivo [.env.example](./.env.example) como referência. Nunca envie arquivos .env ao GitHub.

| Variável | Onde é usada | Finalidade |
| --- | --- | --- |
| DATABASE_URL | API e Prisma | Conexão PostgreSQL/Neon |
| PORT | API | Porta do servidor Fastify |
| FRONTEND_URL | API | URL exata do frontend; usada por CORS, cookies e link de recuperação |
| JWT_SECRET | API | Assinatura dos tokens de sessão; use valor forte com pelo menos 32 caracteres |
| BREVO_API_KEY | API | Envio de e-mails de recuperação de senha |
| BREVO_SENDER_EMAIL | API | Remetente previamente verificado no Brevo |
| BREVO_SENDER_NAME | API | Nome exibido como remetente |
| API_URL ou NEXT_PUBLIC_API_URL | Web | URL da API usada pelo rewrite /api |

### Configuração de produção

**Render (API)**

- Configure todas as variáveis da tabela acima, exceto as exclusivas do frontend.
- Defina NODE_ENV=production.
- Aponte FRONTEND_URL para a URL publicada no Vercel.
- O health check é /health.

**Vercel (web)**

- Configure API_URL com a URL pública da API Render, sem barra final.
- Após mudar essa variável, faça um novo deploy para que o rewrite seja atualizado.

**Brevo**

- Crie uma chave de API transacional.
- Verifique o endereço usado em BREVO_SENDER_EMAIL.
- Cadastre BREVO_API_KEY, BREVO_SENDER_EMAIL e BREVO_SENDER_NAME no Render.

## Comandos úteis

~~~bash
# Desenvolvimento de todo o monorepo
pnpm dev

# Build de todos os pacotes
pnpm build

# Testes configurados no monorepo
pnpm test

# Frontend
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build

# API
pnpm --filter api check-types
pnpm --filter api test

# Banco de dados
pnpm --filter @fixsi/database exec prisma generate
pnpm --filter @fixsi/database exec prisma migrate dev --name nome_da_migracao
pnpm --filter @fixsi/database exec prisma migrate deploy
~~~

## Segurança aplicada

- Senhas armazenadas como hash bcrypt; nunca em texto puro.
- Cookies de autenticação HTTP-only, protegidos contra leitura por JavaScript.
- Token de acesso de curta duração e refresh token rotativo.
- Sessões podem ser revogadas ao alterar a senha ou excluir a conta.
- Proteção de origem para requisições que alteram dados.
- Rate limiting em cadastro, login, recuperação e renovação de sessão.
- Validação de dados com Zod em todas as rotas relevantes.
- CPF e telefone normalizados antes da validação.
- Permissões verificadas no backend para editar, excluir, administrar anúncios, mensagens e agendamentos.
- Tokens de recuperação armazenados somente como hash, com uso único e validade de uma hora.

## Fluxo resumido de contratação

1. O cliente busca um serviço e escolhe um profissional.
2. Seleciona um dia disponível e envia a solicitação.
3. A Fixsi cria o agendamento e a conversa.
4. Cliente e profissional conversam e negociam propostas ou contrapropostas.
5. Uma proposta é aceita e o serviço é confirmado.
6. Após a realização, as duas partes concluem a etapa e deixam suas avaliações.

## Próximas evoluções

- Integração de pagamento com retenção de valor e repasse ao profissional.
- Upload de imagens para armazenamento próprio, substituindo URLs externas.
- Login social, como Google.
- Notificações por e-mail e push para novos pedidos e mensagens.
- Painel administrativo com métricas e auditoria mais detalhada.

## Licença e contexto

Projeto acadêmico desenvolvido para a disciplina de Desenvolvimento de Solução Computacional. O uso, a distribuição e futuras integrações devem respeitar as decisões do grupo responsável.
