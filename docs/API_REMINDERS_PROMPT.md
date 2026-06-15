# Prompt para implementar envio de lembretes na API Go

Implemente na API Go do Invitely uma rota autenticada para disparar lembretes por e-mail para convidados de um evento.

## Objetivo

Criar um endpoint para o painel do organizador enviar lembretes de RSVP relacionados a um evento existente. O frontend ja prepara estes dados:

- evento selecionado;
- e-mail do remetente;
- lista de e-mails destinatarios;
- assunto;
- mensagem.

## Endpoint sugerido

`POST /events/{id}/reminders`

Este endpoint deve exigir autenticacao via Bearer token, igual aos endpoints de eventos e convidados.

## Payload esperado

```json
{
    "from_email": "organizador@example.com",
    "recipients": ["convidado1@example.com", "convidado2@example.com"],
    "subject": "Lembrete: confirme sua presenca no evento",
    "message": "Oi! Passando para lembrar voce de confirmar presenca."
}
```

## Validacoes

- `id` deve ser um evento existente da organizacao autenticada.
- `from_email` deve ser um e-mail valido.
- `recipients` deve ter pelo menos 1 e-mail valido.
- `subject` deve ser obrigatorio.
- `message` deve ser obrigatoria.
- O organizador nao deve conseguir enviar lembrete para evento de outra organizacao.
- Idealmente limitar quantidade de destinatarios por requisicao, por exemplo 200.

## Comportamento

1. Buscar o evento por ID e garantir que pertence a organizacao autenticada.
2. Validar remetente, destinatarios, assunto e mensagem.
3. Opcionalmente cruzar `recipients` com convidados cadastrados em `GET /guests?event_id={id}`.
4. Enfileirar e-mails ou enviar pelo provedor configurado.
5. Registrar um log/registro de campanha com:
    - `event_id`;
    - `from_email`;
    - quantidade de destinatarios;
    - status inicial;
    - timestamps.

## Resposta de sucesso

Pode retornar `202 Accepted`:

```json
{
    "data": {
        "event_id": "evt_123",
        "queued": 2,
        "status": "queued"
    }
}
```

## Respostas de erro

- `400` para payload invalido.
- `401` sem token.
- `403` se o evento nao pertencer a organizacao.
- `404` se o evento nao existir.
- `422` para validacao detalhada.
- `502` ou `503` se o provedor de e-mail estiver indisponivel.

## Swagger/OpenAPI

Atualize a documentacao Swagger com uma nova secao, por exemplo `Lembretes`, contendo:

- `POST /events/{id}/reminders`
- schema do request;
- schema da resposta;
- exemplos de erro.

## Observacao para o app Laravel

Depois que a rota existir na API Go, liberar o proxy Laravel em `app/Http/Controllers/Api/GoApiProxyController.php`:

```php
'POST' => [
    // ...
    'events/*/reminders',
],
```

O frontend podera chamar:

`POST /api/v1/go/events/{id}/reminders`
