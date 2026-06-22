# Deploy em producao

Este projeto e Laravel + React/Vite. Isso significa que existem dois caminhos de producao.

## Caminho recomendado para SaaS completo

Suba o Laravel como backend completo em uma plataforma que rode PHP, filas e banco:

- VPS com Docker;
- Railway;
- Render;
- Fly.io;
- DigitalOcean;
- AWS/GCP/Azure.

Nesse modelo, o Laravel serve:

- API `/api/v1`;
- autenticacao Sanctum;
- migrations e seeders;
- filas;
- cache;
- build React em `public/build`.

Comandos principais:

```bash
docker compose up -d --build
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose exec node npm run build
```

## Caminho Vercel com API do projeto

A Vercel publica a SPA React e tambem inclui uma funcao serverless em `api/[...path].js`.
Essa funcao recebe chamadas como `/api/v1/invitely/auth/login` e `/api/v1/invitely/events` no mesmo dominio da Vercel e encaminha para o backend Laravel deste repositorio.

Por isso, no deploy Vercel deste repositorio:

- a Vercel publica a SPA React;
- chamadas `/api/*` passam pelo proxy serverless do proprio projeto;
- `LARAVEL_API_URL` deve apontar para a URL publica onde este Laravel esta rodando;
- o frontend pode manter `VITE_API_URL` vazio para usar `/api/*` no mesmo dominio.

## Configuracao na Vercel

Use:

| Campo            | Valor                  |
| ---------------- | ---------------------- |
| Framework Preset | `Vite`                 |
| Install Command  | `npm install`          |
| Build Command    | `npm run build:vercel` |
| Output Directory | `dist`                 |

O arquivo `vercel.json` ja define:

- `buildCommand`;
- `outputDirectory`;
- rewrite de SPA para `index.html`.

## Variaveis na Vercel

Configure:

```env
LARAVEL_API_URL=https://sua-api-laravel.com
VITE_API_URL=
VITE_APP_NAME=Invitely
VITE_SITE_URL=https://seu-projeto.vercel.app
NEXT_PUBLIC_SITE_URL=https://seu-projeto.vercel.app
```

`LARAVEL_API_URL` e a raiz do backend Laravel, sem `/api` no final. Exemplo correto: `https://api.invitely.com`.

`VITE_API_URL` deve ficar vazio quando voce quiser que o navegador chame `/api/*` no proprio dominio da Vercel e deixe o proxy encaminhar para o Laravel.
Nao configure `VITE_API_URL` com a URL da API Go (`GO_API_URL`), porque o navegador chamaria `/api/v1/invitely/...` direto nela e receberia `404`.

`VITE_SITE_URL` e `NEXT_PUBLIC_SITE_URL` documentam a URL publica usada nos links de e-mail. No app Vite, `VITE_SITE_URL` e a variavel lida pelo browser. `NEXT_PUBLIC_SITE_URL` fica disponivel para compatibilidade com uma futura migracao Next.js.

## RSVP publico com codigo

O RSVP publico sem senha usa a tabela `public_rsvp_otps`. No Laravel, rode as migrations normalmente:

```bash
docker compose exec app php artisan migrate
```

Recomendacao de seguranca:

- nao exponha a tabela de OTP diretamente ao navegador;
- gere e valide codigos apenas pela API confiavel;
- o codigo deve expirar em 10 minutos e e salvo apenas como hash.

## URL do backend Laravel

Correto:

```env
LARAVEL_API_URL=https://api.invitely.com
```

Errado:

```env
LARAVEL_API_URL=https://api.invitely.com/api
```

## Teste local do build Vercel

```bash
npm run build:vercel
npx vite preview --host 0.0.0.0 --port 4173
```

Arquivos esperados:

```text
dist/
  index.html
  assets/
```

## Por que o 404 acontecia

O build Laravel padrao gera assets em:

```text
public/build
```

Esse diretorio e correto para o Laravel, mas nao e uma SPA Vite completa para a Vercel.

Para a Vercel abrir uma SPA, ela precisa encontrar:

```text
dist/index.html
```

E para rotas como `/login`, `/admin` e `/events/invitely-launch-night` funcionarem ao recarregar a pagina, a Vercel precisa redirecionar essas rotas para `index.html`. Isso e feito pelo `vercel.json`.

## Checklist rapido

Antes de fazer deploy:

```bash
npm run typecheck
npm run lint
npm run build:vercel
```

Depois confira:

```bash
dir dist
```

No Linux/macOS:

```bash
ls -la dist
```

Se nao existir `dist/index.html`, a Vercel vai continuar retornando `404 NOT_FOUND`.

## Healthchecks de producao

Depois do deploy, valide os dois servicos:

```text
Laravel app: /up
API Go: /health
```

Exemplos:

```text
https://seu-laravel.onrender.com/up
https://sua-api-go.onrender.com/health
```

Fluxo de arquitetura esperado:

```text
React -> Laravel BFF/Proxy -> API Go -> PostgreSQL/Supabase
```
