# Invitely

[![CI](https://github.com/BruttiZ/ConviteEventos/actions/workflows/ci.yml/badge.svg)](https://github.com/BruttiZ/ConviteEventos/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.4-777bb4.svg)](composer.json)
[![Laravel](https://img.shields.io/badge/Laravel-12-ff2d20.svg)](composer.json)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](package.json)

Invitely é uma plataforma open source e SaaS-ready para criação de eventos, convites digitais, convidados, RSVP, check-in por QR Code e operação de eventos.

O projeto usa Laravel, React, TypeScript, PostgreSQL, Redis, TailwindCSS, Framer Motion e Docker. O Laravel tambem pode atuar como BFF/proxy para uma API Go complementar, usada para fluxos operacionais como eventos, convidados, orcamento, presentes, analytics e lembretes. A proposta é parecer um produto premium de uma startup moderna, mas continuar simples para qualquer pessoa rodar localmente.

## Prévia

Depois de subir o Docker, abra:

- Landing page: `http://localhost:8082`
- Convite de exemplo: `http://localhost:8082/events/invitely-launch-night`
- Login / cadastro: `http://localhost:8082/login`
- Dashboard interativo: `http://localhost:8082/admin`

## Identidade visual

O redesign atual usa uma estética dark premium inspirada em Linear, Stripe, Vercel, Raycast e Apple Events:

- Fundo principal `#060B1A`.
- Sidebar e superfícies secundárias `#0B0F1A`.
- Cards `#121827` e cards elevados `#1A1F2E`.
- Bordas suaves `#263247`.
- Ações em gradiente roxo/ciano com `#8B5CF6`, `#0EA5E9` e `#22D3EE`.
- Tipografia Inter, títulos fortes, cards arredondados, glassmorphism leve e microinterações com Framer Motion.

## Funcionalidades atuais

- Landing page SaaS moderna com hero, mockup flutuante de dashboard e cards de benefícios.
- Convite público premium com palco visual, RSVP reativo, feedback de confirmação, countdown, galeria e QR Code.
- Link público de convite por evento em `/events/{slug}`, com nome/e-mail, confirmação ou recusa de presença, acompanhantes e mensagem.
- RSVP público sem login com suporte a dois fluxos: link compartilhável por e-mail direto e código de 6 dígitos por e-mail para validação reforçada.
- Formulário de confirmação com nome, e-mail, acompanhantes com botões `+` e `-`, mensagem opcional, confirmar e recusar.
- Login/cadastro real com Supabase Auth e perfis iniciais de organizador ou convidado.
- Dashboard responsivo com sidebar no desktop, bottom navigation no mobile, métricas, gráfico de linha, distribuição de RSVP e cards de eventos.
- Eventos com link copiável de convite, templates/fundos aplicáveis e visual público sincronizado com o card do painel.
- Telas operacionais de eventos, convidados, templates, check-in, relatórios, integrações, configurações e plataforma.
- API Laravel versionada com Sanctum, Actions, DTOs, repositories, Form Requests, policies e resources.
- Proxy Laravel para API Go em `/api/v1/go/*`, com allowlist de rotas e repasse de `Authorization`/`X-Internal-Api-Key`.
- Stack Docker com Nginx, PHP 8.4-FPM, PostgreSQL, Redis, Mailpit, MinIO e Node para build frontend.

## Stack

| Área        | Tecnologia                                                           |
| ----------- | -------------------------------------------------------------------- |
| Backend     | Laravel 12, PHP 8.4, Sanctum                                         |
| API Go      | Servico complementar via `GO_API_URL`, acessado pelo proxy Laravel   |
| Frontend    | React 19, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons |
| Dados       | PostgreSQL, Redis, Supabase Auth                                     |
| Infra local | Docker, Nginx, Mailpit, MinIO                                        |
| Qualidade   | PestPHP, PHPStan/Larastan, Laravel Pint, ESLint, Prettier            |

## Como rodar

```bash
cp .env.example .env
docker compose up -d --build
```

No PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

## Autenticação

O frontend usa Supabase Auth para cadastro e login reais.

Configure no `.env` local ou nas variáveis da Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

No cadastro, o usuário escolhe o perfil inicial:

- `Organizador`: acessa o dashboard operacional.
- `Convidado`: acessa o convite público.

O papel `Admin da plataforma` não é autoatribuído publicamente. Para testar esse papel com Supabase, promova o usuário manualmente no metadata do Supabase para `role = platform_admin`.

## Link público de convite e RSVP

Cada evento possui um link público no formato:

```text
http://localhost:8082/events/{slug-do-evento}
```

No dashboard do organizador, a aba `Eventos` mostra um bloco `Link de convite` em cada card e também dentro de `Gerenciar evento`. O organizador pode copiar esse link e enviar para outra pessoa. Quem recebe o link informa nome, e-mail, status (`accepted` ou `declined`), acompanhantes e mensagem.

O backend Laravel registra esse fluxo em:

- `GET /api/v1/events/{slug}`: retorna o evento público publicado.
- `POST /api/v1/events/{slug}/rsvp`: cria ou atualiza `guests` e `rsvps` pelo e-mail do convidado.
- `POST /api/v1/rsvp/request-code` e `POST /api/v1/rsvp/verify-code`: fluxo opcional com código de 6 dígitos por e-mail.
- `GET /api/v1/invites/{token}` e `POST /api/v1/invites/{token}/accept|reject`: fluxo de convite individual com token.

Para evitar duplicidade, o RSVP por link público usa `event_id + email` como identidade do convidado. Se a pessoa responder novamente com o mesmo e-mail, o RSVP é atualizado em vez de criar outro convidado.

## API Go complementar

O Laravel continua sendo a API principal do repositório, mas o projeto já está preparado para conversar com uma API Go externa por meio do proxy:

```text
/api/v1/go/{rota-da-api-go}
```

Configure no `.env`:

```env
GO_API_URL=https://invitelyapi.onrender.com
GO_API_INTERNAL_KEY=
GO_API_TIMEOUT=30
```

O navegador não deve chamar a API Go diretamente. O frontend chama o Laravel em `/api/v1/go/*`; o Laravel valida a rota em `GoApiProxyController`, repassa `Authorization` quando existir, adiciona `X-Internal-Api-Key` quando configurado e encaminha a requisição para `GO_API_URL`.

Rotas Go atualmente liberadas no proxy:

- `GET /health`
- `GET /auth/me`
- `GET|POST /events`
- `GET|PUT /events/{id}`
- `GET|POST /guests`
- `GET /dashboard`
- `GET /analytics/events/{id}`
- `POST /events/{id}/budget`, `PUT|DELETE /budget/{id}`
- `POST /events/{id}/gifts`, `PUT|DELETE /gifts/{id}`
- `POST /events/{id}/reminders`
- `POST /rsvp`

Em produção, `GO_API_URL` precisa ser HTTPS e não pode apontar para `localhost`.

## Comandos úteis

```bash
docker compose ps
docker compose logs -f app
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run typecheck
docker compose exec node npm run build
npm run build:vercel
```

## Arquitetura

O backend é organizado por fronteiras de domínio e casos de uso:

- `app/Domain`: actions, DTOs e contratos.
- `app/Infrastructure`: implementações Eloquent dos contratos.
- `app/Http`: controllers, middleware, form requests e resources.
- `app/Http/Controllers/Api/GoApiProxyController.php`: proxy controlado para a API Go.
- `app/Support/Tenancy`: contexto de tenant.
- `database`: schemas de tenants, eventos, convidados, RSVP, check-in e operação.

O frontend é organizado por features:

- `resources/js/app/features/landing`: landing page SaaS.
- `resources/js/app/features/auth`: login e cadastro reais com Supabase Auth.
- `resources/js/app/features/admin`: dashboard operacional.
- `resources/js/app/features/public`: convite público e RSVP.
- `docs/sql/public_rsvp_otps.sql`: script SQL para criar a tabela de OTP do RSVP público no Supabase.

## Fluxo de portfólio

1. Abra `http://localhost:8082`.
2. Clique em `Começar agora` ou acesse `http://localhost:8082/login`.
3. Crie uma conta com e-mail, senha e perfil inicial.
4. Faça login com as credenciais cadastradas.
5. Explore o dashboard, os cards, o check-in e o convite público.

No Docker local, o React é servido pelo build gerado em `public/build` através do Nginx. O service worker é desativado fora de produção para evitar JavaScript antigo em cache.

Para publicar apenas o frontend na Vercel, use `npm run build:vercel`, Output Directory `dist`, configure `LARAVEL_API_URL` apontando para o backend Laravel publicado e deixe `VITE_API_URL` vazio. Veja [docs/production.md](docs/production.md).

## Roadmap

- CRUD real completo para eventos e convidados na UI.
- Importação/exportação CSV avançada.
- Upload de imagens com MinIO.
- Leitor real de QR Code no check-in.
- Builder visual de temas e templates.
- Jobs de e-mail e lembretes de RSVP.
- Screenshots e GIF oficial em `docs/assets`.
- Documentação OpenAPI/Swagger expandida.

## Contribuição

Leia [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) e [SECURITY.md](SECURITY.md) antes de abrir issues ou pull requests.

O projeto usa Conventional Commits em português brasileiro:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia Docker
```

## Licença

Invitely é um software open source licenciado sob a [MIT license](LICENSE).
