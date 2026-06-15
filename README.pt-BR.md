# Invitely

Invitely e uma plataforma open source para convites digitais, RSVP, check-in por QR Code e gerenciamento de eventos. O projeto usa Laravel 12 no backend, React com TypeScript no frontend e Docker com Nginx, PHP-FPM, PostgreSQL, Redis, Mailpit e MinIO.

## Como o projeto funciona

O Nginx recebe as requisicoes em `http://localhost:8080` e encaminha PHP para o container `app`, que roda Laravel em PHP 8.4-FPM. O Laravel entrega a SPA React pelo Blade em `resources/views/app.blade.php`; o React assume as rotas publicas, login/cadastro e dashboard no navegador.

As rotas da API ficam em `routes/api.php` com prefixo `/api/v1`. A pagina publica busca dados em `/api/v1/events/{slug}` e registra RSVP em `/api/v1/events/{slug}/rsvp`. Para o portfolio publicado na Vercel, o login/cadastro usa Supabase Auth e o dashboard em `/admin` muda conforme o papel salvo no metadata do usuario.

## Fluxo de portfolio

Abra:

- Landing page: `http://localhost:8080`
- Convite de exemplo: `http://localhost:8080/events/invitely-launch-night`
- Login / cadastro: `http://localhost:8080/login`
- Dashboard: `http://localhost:8080/admin`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

## Autenticacao

O frontend usa Supabase Auth para cadastro e login reais.

Configure:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

No cadastro, o usuario escolhe o perfil inicial:

- `Organizador`: acessa o dashboard operacional.
- `Convidado`: acessa o convite publico.

O papel `Admin da plataforma` deve ser promovido manualmente no Supabase metadata com `role = platform_admin`.

## Redesign atual

O app foi redesenhado para uma estética dark premium de SaaS moderno:

- Landing page com hero "Eventos incríveis. Conexões reais. Resultados extraordinários.".
- Mockup flutuante do dashboard na hero.
- Dashboard com sidebar desktop, bottom navigation mobile, métricas, gráfico de linha e distribuição de RSVP.
- Eventos em cards com imagem, status, data, local, confirmados, taxa de RSVP e CTA.
- Convite público com imagem de fundo, overlay escuro, countdown, formulário confortável e QR Code.
- RSVP publico sem login com codigo de 6 digitos por e-mail, expiracao de 10 minutos e atualizacao de convidados/RSVP.
- Paleta baseada em `#060B1A`, `#0B0F1A`, `#121827`, `#263247`, `#8B5CF6`, `#22D3EE` e `#0EA5E9`.

## Servicos Docker

| Servico    | Funcao                               | URL/porta padrao                                      |
| ---------- | ------------------------------------ | ----------------------------------------------------- |
| `nginx`    | Servidor web da aplicacao            | `http://localhost:8080`                               |
| `app`      | Laravel / PHP-FPM                    | interno, porta `9000`                                 |
| `queue`    | Worker de filas Laravel              | interno                                               |
| `node`     | Instala dependencias JS e gera build | interno                                               |
| `postgres` | Banco de dados                       | `localhost:5432`                                      |
| `redis`    | Cache, sessao e filas                | `localhost:6379`                                      |
| `mailpit`  | Caixa de e-mail local                | `http://localhost:8025`                               |
| `minio`    | Storage S3 local                     | API `localhost:9000`, console `http://localhost:9001` |

## Como rodar com Docker

```bash
cp .env.example .env
docker compose up -d --build
```

No PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

O container `app` prepara o Laravel automaticamente: gera `APP_KEY` quando necessario, limpa cache, cria `storage:link`, roda migrations e seeders. O container `node` instala dependencias JS, gera `public/build` e remove `public/hot` para garantir que o Nginx sirva os assets estaticos do build.

## Comandos uteis

```bash
docker compose ps
docker compose logs -f app
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan route:list --path=api
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run typecheck
docker compose exec node npm run build
npm run build:vercel
```

Para publicar apenas o frontend na Vercel, use `npm run build:vercel`, Output Directory `dist`, configure `LARAVEL_API_URL` apontando para o backend Laravel publicado e deixe `VITE_API_URL` vazio. Veja [docs/production.md](docs/production.md).

Para recriar o banco do zero:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

Para parar tudo:

```bash
docker compose down
```

Para parar e apagar volumes locais:

```bash
docker compose down -v
```

## Desenvolvimento frontend

No fluxo Docker padrao, abra sempre `http://localhost:8080`. O navegador nao precisa acessar uma porta Vite separada. O service worker fica desabilitado em ambiente local para evitar cache antigo durante desenvolvimento.

Se quiser rodar ferramentas JS:

```bash
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

## Padrao de commits

O projeto usa Conventional Commits em portugues brasileiro.

Exemplos validos:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia Docker
```

## Solucao de problemas

Se a tela ficar branca, rode:

```bash
docker compose exec node npm run build
docker compose restart nginx
```

Depois abra novamente `http://localhost:8080` com reload forte no navegador.

Se o login retornar erro de banco, confirme que o Docker esta usando PostgreSQL:

```bash
docker compose exec app php artisan tinker --execute="dump(config('database.default'));"
```

O valor esperado no Docker e `pgsql`.
