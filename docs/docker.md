# Docker

O ambiente Docker foi pensado para onboarding rapido e previsivel.

## Servicos

- `nginx`: expoe a aplicacao em `APP_PORT`, por padrao `8082`.
- `app`: Laravel em PHP-FPM.
- `queue`: worker de filas Laravel.
- `node`: instala dependencias JS e gera o build frontend.
- `postgres`: banco principal.
- `redis`: cache, sessao e filas.
- `mailpit`: caixa de e-mail local.
- `minio`: storage compativel com S3.

## Primeiro uso

```bash
cp .env.example .env
docker compose up -d --build
```

O container `app` executa automaticamente:

- instalacao Composer quando `vendor/autoload.php` nao existe;
- geracao de `APP_KEY` quando necessario;
- ajuste de permissoes em `storage` e `bootstrap/cache`;
- limpeza de cache;
- link de storage;
- migrations;
- seeders.

O servico `node` executa automaticamente:

- `npm install`;
- `npm run build` para popular `public/build`;
- remocao de `public/hot` para garantir que o Laravel use os assets estaticos;
- processo persistente para healthcheck e comandos de tooling.

No fluxo Docker padrao, abra a aplicacao em `http://localhost:8082`. O navegador nao precisa acessar uma porta Vite separada.

Rotas principais:

- Landing page: `http://localhost:8082`
- Login / cadastro: `http://localhost:8082/login`
- Dashboard: `http://localhost:8082/admin`
- Convite de exemplo: `http://localhost:8082/events/invitely-launch-night`

## Autenticacao

O frontend usa Supabase Auth para cadastro e login reais no ambiente de portfolio.

Configure no `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

## Comandos uteis

```bash
docker compose ps
docker compose config --quiet
docker compose logs -f app
docker compose exec app php artisan migrate:fresh --seed
docker compose exec app php artisan test
docker compose exec node npm run build
```

## Reset completo

```bash
docker compose down -v
docker compose up -d --build
```

Esse comando remove volumes locais, incluindo banco, Redis, MinIO, dependencias Composer e build frontend.
