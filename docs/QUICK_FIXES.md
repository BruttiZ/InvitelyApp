# ⚡ Quick Fixes - Rate Limit & Invite Acceptance

## 🔧 O Que Foi Corrigido

### 1. **Email Rate Limit Exceeded**

**Problema:** Erro "email rate limit exceeded" ao cadastrar muitas contas rapidamente.

**Solução Implementada:**

- Adicionado retry automático com exponential backoff (até 3 tentativas)
- Delay inicial de 2 segundos, aumentando progressivamente
- Mensagem de erro melhorada e amigável
- Tentativas ocorrem silenciosamente (sem mostrar cada tentativa)

**Onde foi feito:**

- `resources/js/lib/retry.ts` - Helper com lógica de retry
- `resources/js/app/features/auth/AuthPage.tsx` - Usando retry no signUp e resend

**Como funciona:**

```
Tentativa 1: Falha com rate limit → Aguarda 2s
Tentativa 2: Falha com rate limit → Aguarda 4s
Tentativa 3: Sucesso! ✅
```

---

### 2. **Novo Fluxo: Aceitar Convite por Link**

**O que é:** Quando organizador envia convite para alguém, a pessoa recebe um link (com token) que a leva para uma página de aceitar/recusar convite **sem criar conta**.

**Fluxo:**

1. Organizador cria evento e adiciona convidados
2. Convidado recebe e-mail com link: `https://seu-site.com/invite?token=abc123`
3. Clica no link → vai para `/invite?token=abc123`
4. Vê seu nome, email, evento (pré-carregado)
5. Clica "Aceitar convite" ou "Recusar"
6. Se aceitar → redireciona para cadastro (agora pré-preenchido com email/nome)
7. Se recusar → volta ao início

**Arquivos Novos:**

- `resources/js/app/features/auth/InviteAcceptPage.tsx` - Página de aceitar convite
- `app/Http/Controllers/Api/InviteController.php` - Backend endpoints

**Rotas Adicionadas:**

```
GET  /api/v1/invites/{token}           - Get convite details
POST /api/v1/invites/{token}/accept    - Aceitar convite
POST /api/v1/invites/{token}/reject    - Recusar convite
GET  /invite?token=xxx                 - Página de aceitar
```

---

## 🚀 Como Usar

### 1. Corrigir Rate Limit

Não precisa fazer nada! O retry automático já está ativo. Se der "email rate limit exceeded", o sistema vai tentar automaticamente até 3 vezes.

**Melhor prática:** Para desenvolvimento, deixar pequeno delay entre testes (não fazer spam de cadastros).

### 2. Usar o Novo Fluxo de Convites

**No frontend (React):**

```typescript
// Quando cria convidado, gerar token:
const inviteUrl = `${siteUrl}/invite?token=${guest.invite_token}`;
// Enviar esse link por e-mail
```

**No backend (Laravel):**

```php
// Guest model já tem 'invite_token' field
$guest = Guest::create([
    'event_id' => $event->id,
    'name' => 'João Silva',
    'email' => 'joao@example.com',
    'invite_token' => Str::random(32),
    'status' => 'invited',
]);
```

---

## ✅ Testes

### Testar Rate Limit Fix

1. Abra `http://localhost:5174/login`
2. Clique "Cadastro"
3. Preencha com um novo email
4. Clique "Cadastrar"
5. Se der rate limit → deixa retentar (não faz nada, aguarda)
6. Deve ter sucesso após alguns segundos

### Testar Fluxo de Convites

1. Backend: Criar um guest com `invite_token = 'test123'`
2. Abra: `http://localhost:5174/invite?token=test123`
3. Deve mostrar nome/email/evento do convite
4. Clique "Aceitar convite"
5. Deve redirecionar para `/auth` com email pré-preenchido
6. Teste também "Recusar convite"

---

## 📋 Arquivos Modificados

| Arquivo                                               | O Que Mudou                                    |
| ----------------------------------------------------- | ---------------------------------------------- |
| `resources/js/lib/retry.ts`                           | ✨ Novo - Helper de retry                      |
| `resources/js/app/features/auth/InviteAcceptPage.tsx` | ✨ Novo - Página de convite                    |
| `resources/js/app/features/auth/AuthPage.tsx`         | 🔄 Atualizado - Usa retry + mensagens melhores |
| `resources/js/app.tsx`                                | 🔄 Atualizado - Rota `/invite` adicionada      |
| `app/Http/Controllers/Api/InviteController.php`       | ✨ Novo - Endpoints de convite                 |
| `routes/api.php`                                      | 🔄 Atualizado - Rotas de invites               |

---

## 🔍 Debugging

### "email rate limit exceeded" ainda aparece?

- Verificar se `resources/js/lib/retry.ts` foi criado
- Verificar se `AuthPage.tsx` importa `retryWithExponentialBackoff`
- Verificar se browser console mostra "Rate limit... Retrying in Xms"

### Convite não carrega?

- Verificar se `/api/v1/invites/{token}` retorna 200
- Verificar se Guest tem campo `invite_token` preenchido
- Verificar console para ver erro exato

### Link de convite está quebrado?

- Verificar formato: `http://localhost:5174/invite?token=SEU_TOKEN_AQUI`
- Verificar se rota `/invite` existe no `app.tsx`

---

## 📞 Próximos Passos

1. **Criar componente de envio de convites** - No admin, quando cria convidados
2. **Adicionar página de "Meus Convites"** - Convidado vê seus convites
3. **Adicionar e-mail de convite automático** - Ao criar convidado, envia email
4. **Integrar com sistema de RSVP** - Após aceitar convite, pedir confirmação

---

**Data:** 2026-06-08 | **Status:** ✅ Implementado
