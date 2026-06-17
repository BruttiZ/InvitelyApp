# 🔐 Super User + Dados Dinâmicos

## 🔑 Super User (Login Especial)

Agora você pode logar com um usuário super que tem permissão total sem criar conta no Supabase.

### Como Usar

1. **Abra `.env.local`** e configure:

```env
VITE_SUPER_USER_EMAIL=admin@invitely.local
VITE_SUPER_USER_PASSWORD=admin123456
```

2. **Vá para login:** `http://localhost:5174/login`

3. **Clique "Login"** e use:
    - **E-mail:** `admin@invitely.local`
    - **Senha:** `admin123456`

4. **Pronto!** Você está logado como "Admin Invitely" com permissão total

### Características

- ✅ Acesso a TUDO (admin dashboard, criar eventos, etc)
- ✅ Sem precisar confirmar e-mail
- ✅ Sem código OTP
- ✅ Funciona offline/desenvolvimento
- ✅ Credenciais pelo `.env`

---

## 👤 Dados Dinâmicos do Usuário

Todos os hardcoded foram removidos! Agora o app usa dados reais:

### Nome do Usuário

Antes: "Bem-vinda, Marina!"  
Agora: "Bem-vindo, [seu nome]!"

O nome vem de onde você cadastrou ou da sessão logada.

**Se cadastrar via Supabase:**

```
Nome: João Silva → "Bem-vindo, João Silva!"
Nome: Maria Costa → "Bem-vinda, Maria Costa!"
```

**Se logar com super user:**

```
→ "Bem-vindo, Admin Invitely!"
```

### E-mail do Usuário

Mostra e-mail real em vez de hardcoded:

```
Antes: Marina Host / user@test.com
Agora: [Seu Nome] / [Seu E-mail Real]
```

---

## 📊 Dados Dinâmicos do Dashboard

### Métricas (Cards no topo)

```
Eventos: 24
Convidados: 1.204
Taxa RSVP: 76%
Check-ins: 846
```

**⚠️ Placeholder por enquanto!**  
Quando integrarem API, virão de verdade:

```typescript
// Será chamado da API
GET /api/v1/admin/events?metrics=true
```

**Arquivo:** `resources/js/app/features/admin/AdminDashboard.tsx` → `getDefaultMetrics()`

### Eventos (Cards do meio)

```
- Invitely Launch Night (23 jul)
- Founders Dinner (05 ago)
- Aurora Summit (12 set)
```

**⚠️ Dados de exemplo!**  
Quando integrarem API:

```typescript
// Será chamado da API
GET / api / v1 / admin / events;
```

**Arquivo:** `getDefaultEventCards()`

### Atividade Recente (Lado esquerdo)

```
- João Silva confirmou presença em Invitely Launch Night
- Maria Oliveira fez check-in...
- Lucas Pereira recusou...
```

**⚠️ Dados de exemplo!**  
Quando integrarem API:

```typescript
// Será chamado da API
GET /api/v1/admin/events/activity?last=10
```

**Arquivo:** `getDefaultActivity()`

---

## 🔄 Próximos Passos

Para deixar dinâmico de verdade, você precisa:

### 1. Criar Hooks para Buscar Dados

```typescript
// resources/js/hooks/useMetrics.ts
export function useMetrics() {
    return useQuery({
        queryKey: ['metrics'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/v1/admin/metrics'));
            return res.json();
        },
    });
}
```

### 2. Usar no Overview

```typescript
function Overview() {
    const { data: metricsData } = useMetrics();
    const { data: eventsData } = useEvents();
    const { data: activityData } = useActivity();

    const metrics = metricsData || getDefaultMetrics();
    const eventCards = eventsData || getDefaultEventCards();
    const activity = activityData || getDefaultActivity();

    return (
        // ... render com dados reais ou defaults
    );
}
```

### 3. Backend Endpoints Necessários

```php
// app/Http/Controllers/Api/Admin/AdminMetricsController.php
GET  /api/v1/admin/metrics      → métricas do dashboard
GET  /api/v1/admin/events       → lista eventos do usuário
GET  /api/v1/admin/activity     → atividade recente
```

---

## 📝 Modificações Feitas

| Arquivo              | O Que Mudou                                    |
| -------------------- | ---------------------------------------------- |
| `.env.local.example` | ✨ Novo - VITE_SUPER_USER_EMAIL/PASSWORD       |
| `AuthPage.tsx`       | 🔄 Adicionado suporte a super user             |
| `AdminDashboard.tsx` | 🔄 Removido hardcoded Marina + dinâmico name   |
| `AdminDashboard.tsx` | 🔄 Métrica/eventos/atividade agora via funções |
| `VerifyOtpPage.tsx`  | 🔄 Corrigido toAuthSession                     |

---

## 🧪 Teste Rápido

### Com Super User

```
1. npm run dev
2. Vai para http://localhost:5174/login
3. Clica "Login"
4. E-mail: admin@invitely.local
5. Senha: admin123456
6. Entra com "Admin Invitely"
```

### Com Cadastro Normal

```
1. Clica "Cadastro"
2. Nome: "Seu Nome Aqui"
3. Preencha tudo
4. Confirma e-mail
5. Entra com seu nome na mensagem de boas-vindas
```

---

## 🎯 Personalizações

Você agora pode:

- ✅ Mudar email/senha do super user no `.env`
- ✅ Ver seu próprio nome na tela
- ✅ Ver nome do evento dinâmico quando clicar
- ✅ Converter para API quando tiver backend pronto

---

**Data:** 2026-06-08 | **Status:** ✅ Implementado
