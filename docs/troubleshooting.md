# Troubleshooting

## Porta ocupada

Altere a porta no `.env`:

```env
APP_PORT=8082
POSTGRES_PORT=5433
```

Depois rode:

```bash
docker compose up -d
```

## Dependencias PHP ausentes no container

Se comandos como `php artisan test`, `vendor/bin/pint` ou `vendor/bin/phpstan` nao existirem, atualize o volume:

```bash
docker compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader
```

## Assets frontend nao aparecem

Rode o build pelo container Node:

```bash
docker compose exec node npm run build
```

## Login com Supabase nao entra

Confira se as variaveis do Supabase estao configuradas:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
```

Depois gere o build novamente:

```bash
docker compose exec node npm run build
```

No painel do Supabase, confirme tambem:

- `Authentication > Providers > Email` habilitado.
- URL do projeto configurada corretamente.
- Usuario criado em `Authentication > Users`.
- Se confirmacao de e-mail estiver ativa, o e-mail precisa ser confirmado antes do login.

## Confirmacao de e-mail volta para localhost ou mostra otp_expired

Esse erro acontece quando o link de confirmacao foi gerado para uma URL antiga, expirou ou aponta para uma porta local que nao esta aberta.

No Supabase, abra `Authentication > URL Configuration` e configure:

- `Site URL`: URL publica da Vercel, por exemplo `https://seu-projeto.vercel.app`.
- `Redirect URLs`: inclua `https://seu-projeto.vercel.app/**` e as URLs locais usadas no desenvolvimento.

Exemplos locais:

```text
http://localhost:8082/**
http://localhost:4173/**
```

Depois gere um novo e-mail de confirmacao. Links antigos podem continuar apontando para `localhost:3000` ou aparecer como expirados.

## Cadastro bloqueado por senha fraca

O cadastro exige:

- letra minuscula;
- letra maiuscula;
- numero;
- caractere especial;
- minimo de 8 caracteres;
- confirmacao de senha igual ao primeiro campo.

## Resetar tudo

```bash
docker compose down -v
docker compose up -d
```

Use com cuidado: isso apaga dados locais.
