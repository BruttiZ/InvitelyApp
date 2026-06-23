# Docker

O ambiente Docker local e isolado por padrao. Ele sobe banco, cache, e-mail e
storage locais, sem depender do banco de producao.

## Estrutura

- `compose.yaml`: unico arquivo Docker mantido na raiz.
- `Docker/Dockerfile`: imagem local PHP-FPM usada por `app` e `queue`.
- `Docker/Dockerfile.render`: imagem usada pelo Render.
- `Docker/Dockerfile*.dockerignore`: ignores especificos de build.
- `Docker/entrypoint.sh`: bootstrap do Laravel dentro do container.
- `Docker/nginx/default.conf`: virtual host local do Nginx.

## Servicos

- `nginx`: expoe a aplicacao em `APP_PORT`, por padrao `8082`.
- `app`: Laravel em PHP-FPM.
- `queue`: worker de filas Laravel.
- `node`: instala dependencias JS e gera o build frontend.
- `postgres`: banco local.
- `redis`: cache, sessao e filas locais.
- `mailpit`: caixa de e-mail local em `http://localhost:8025`.
- `minio`: storage S3 local em `http://localhost:9001`.

## Primeiro uso

```bash
cp .env.example .env
docker compose up -d --build
```

No PowerShell:

```powershell
Copy-Item .env.example .env
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

No fluxo Docker padrao, abra `http://localhost:8082`. O navegador nao precisa
acessar uma porta Vite separada.

## Env local

O `.env.example` agora e local-first. As integracoes externas ficam vazias por
padrao:

- `GO_API_URL`
- `INVITELY_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Se um `.env` antigo tiver variaveis de banco externas, o `compose.yaml` ainda
forca `app` e `queue` a usarem o Postgres local em `postgres:5432`.

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

Esse comando remove volumes locais, incluindo banco, Redis, MinIO, dependencias
Composer e build frontend.
