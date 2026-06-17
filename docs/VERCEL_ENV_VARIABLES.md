# 🔧 Configurar Environment Variables no Vercel - Passo a Passo Exato

## ⚠️ Erro Comum: "No environment variables were created"

Significa que as variáveis NÃO foram salvas. Vamos fazer correto agora.

---

## 📍 Passo 1: Entrar no Vercel Certo

**URL Exata:**

```
https://vercel.com/dashboard/projects
```

1. Vá nessa URL (login se precisar)
2. Procure o projeto **"ConviteEventos"** ou **"Invitely"**
3. Clique nele

---

## ⚙️ Passo 2: Entrar em Settings

**IMPORTANTE: Deve estar na página do projeto**

No topo da página, você verá:

```
[Project] [Deployments] [Settings] [Analytics] [Monitoring]
                         ⬅️ CLIQUE AQUI
```

Se não ver, clique no menu `•••` (três pontinhos) no canto superior direito.

---

## 🔑 Passo 3: Environment Variables (Menu Esquerdo)

Após clicar em Settings, você verá um menu esquerdo com:

```
General
Environment Variables  ⬅️ CLIQUE AQUI
Domains
Functions
Git
...
```

Clique em **Environment Variables**

---

## 📝 Passo 4: Adicionar Primeira Variável

Você verá um formulário como este:

```
┌─────────────────────────────────┐
│ Name                            │
├─────────────────────────────────┤
│ VITE_SUPER_USER_EMAIL           │  ⬅️ DIGITE AQUI
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Value                           │
├─────────────────────────────────┤
│ admin@invitely.local            │  ⬅️ DIGITE AQUI
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Environments                    │
├─────────────────────────────────┤
│ ☑ Production                    │  ⬅️ MARQUE TUDO
│ ☑ Preview                       │
│ ☑ Development                   │
└─────────────────────────────────┘

[Add Environment Variable]  ⬅️ CLIQUE AQUI (botão azul)
```

### Exatamente o que fazer:

1. **Campo "Name":**

    ```
    VITE_SUPER_USER_EMAIL
    ```

2. **Campo "Value":**

    ```
    admin@invitely.local
    ```

3. **Checkboxes "Environments":**
    - ✅ Production
    - ✅ Preview
    - ✅ Development

4. **Clique no botão AZUL:**
    ```
    "Add Environment Variable"
    ```

---

## 📝 Passo 5: Adicionar Segunda Variável

Após clicar, se tudo deu certo, você voltará para a lista e verá:

```
VITE_SUPER_USER_EMAIL
├─ admin@invitely.local
├─ Environments: Production, Preview, Development
└─ [Edit] [Delete]
```

Agora repita o processo para a **segunda variável**:

1. **Campo "Name":**

    ```
    VITE_SUPER_USER_PASSWORD
    ```

2. **Campo "Value":**

    ```
    admin123456
    ```

3. **Checkboxes:**
    - ✅ Production
    - ✅ Preview
    - ✅ Development

4. **Clique "Add Environment Variable"**

---

## ✅ Passo 6: Verificar se Funcionou

Após adicionar as 2 variáveis, você deve ver:

```
Environment Variables

VITE_SUPER_USER_EMAIL
├─ admin@invitely.local
├─ Environments: Production, Preview, Development
└─ [Edit] [Delete]

VITE_SUPER_USER_PASSWORD
├─ admin123456
├─ Environments: Production, Preview, Development
└─ [Edit] [Delete]
```

Se vê isso, **PERFEITO!** ✅

---

## 🔄 Passo 7: Redeploy Automático (Deve Acontecer Sozinho)

Após adicionar as variáveis, o Vercel pode:

- **Opção 1 (Melhor):** Automatically redeploy (você verá uma notificação)
- **Opção 2:** Você precisa fazer manualmente

### Se não fez automático:

1. Vá em **Deployments** (no topo)
2. Clique no **último deploy** (o topo da lista)
3. Clique no botão **Redeploy** (canto superior direito)
4. Aguarde a barra de progresso terminar (5 min)

---

## 🧪 Passo 8: Testar em Produção

Após o redeploy estar pronto (status: ✅ Ready):

1. Acesse sua URL em produção:

    ```
    https://seu-site.vercel.app/login
    ```

    **Onde encontrar a URL:**
    - Vercel Dashboard → Projeto → Topo da página aparece a URL

2. Clique **"Login"**

3. Digite:

    ```
    E-mail: admin@invitely.local
    Senha: admin123456
    ```

4. Clique **"Entrar"**

5. Se entrou com sucesso como **"Admin Invitely"**, **FUNCIONOU!** 🎉

---

## 🆘 Se Ainda Não Funcionou

### Verificar 1: Variáveis Foram Salvas?

```
Vercel → Project → Settings → Environment Variables

Você vê:
✅ VITE_SUPER_USER_EMAIL ?
✅ VITE_SUPER_USER_PASSWORD ?
```

Se NÃO vê, volte ao Passo 4 e tente novamente. **Certifique-se de clicar o botão "Add Environment Variable"**.

### Verificar 2: Fez Redeploy?

```
Vercel → Deployments

Status do último deploy:
✅ "Ready" (verde) = OK
🟡 "Building..." = Aguarde
❌ "Failed" = Erro no build
```

Se tiver ❌ Failed, clique nele e veja o erro nos logs.

### Verificar 3: Aguardou 5 min?

O Vercel leva ~5 minutos para:

- Build
- Deploy
- Propagar para CDN

**Dica:** Abra em modo anônimo (Ctrl+Shift+Del ou Cmd+Shift+Del) para evitar cache.

### Verificar 4: URL Correta?

Você deve usar:

```
✅ https://seu-site.vercel.app/login
❌ http://localhost:5174/login (isso é local)
❌ https://seu-site.com/login (se usar domínio custom)
```

---

## 📸 Capturas de Tela (Descrições)

### Tela de Environment Variables

```
┌────────────────────────────────────────┐
│ Vercel Dashboard / Projeto / Settings  │
├────────────────────────────────────────┤
│                                        │
│ [Add New]  [Decrypt All]               │  ⬅️ Botão verde no topo
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ VITE_SUPER_USER_EMAIL            │  │
│ │ admin@invitely.local             │  │
│ │ Production Preview Development   │  │
│ │ [Edit] [Delete]                  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ VITE_SUPER_USER_PASSWORD         │  │
│ │ admin123456                      │  │
│ │ Production Preview Development   │  │
│ │ [Edit] [Delete]                  │  │
│ └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [ ] Entrou no Vercel Dashboard
- [ ] Clicou no projeto Invitely/ConviteEventos
- [ ] Clicou em Settings (menu topo)
- [ ] Clicou em "Environment Variables" (menu esquerdo)
- [ ] Adicionou VITE_SUPER_USER_EMAIL = admin@invitely.local
- [ ] Marcou Production ✅ Preview ✅ Development ✅
- [ ] Clicou "Add Environment Variable"
- [ ] Adicionou VITE_SUPER_USER_PASSWORD = admin123456
- [ ] Marcou Production ✅ Preview ✅ Development ✅
- [ ] Clicou "Add Environment Variable"
- [ ] Vê as 2 variáveis na lista (Environment Variables)
- [ ] Fez Redeploy nos Deployments
- [ ] Aguardou 5 min (status = Ready ✅)
- [ ] Testou em produção com super user
- [ ] **Funcionou! 🎉**

---

## 🎯 Próximo Passo

Após tudo funcionar em produção:

1. Testar cadastro normal
2. Testar OTP por e-mail
3. Testar convites
4. Usar em produção!

**Se ainda tiver problema, envie:**

- Screenshot da tela Environment Variables do Vercel
- URL do seu site em produção
- Erro exato que aparece ao tentar logar

---

Data: 2026-06-08 | Versão: 1.0
