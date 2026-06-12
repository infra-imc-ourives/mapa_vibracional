# Integração HOLO RENDA com Webhook n8n

## Resumo da Implementação

A integração do webhook n8n foi implementada com sucesso no projeto HOLO RENDA. Quando a usuária finaliza o formulário, o sistema coleta as respostas e as envia para o webhook externo do n8n.

## Arquivos Modificados

### 1. **`src/lib/n8n-service.ts`** (NOVO)

Serviço responsável pela comunicação com o webhook n8n.

**Funções:**
- `formatFormDataForN8n(formData)` - Converte os dados do formulário para o formato esperado pelo n8n
- `submitHoloRendaForm(formData)` - Envia o formulário para o webhook e retorna a resposta

**Tipo de resposta:**
- `N8nResponse` - Tipo genérico para a resposta do n8n

**Endpoint do webhook:**
```
http://n8n-ia-webhook.elainneourives.com.br/webhook/holorenda
```

**Estrutura do payload enviado:**
```json
{
  "nomeCompleto": "string",
  "cidadeEstado": "string",
  "situacaoProfissional": "string",
  "situacaoProfissionalOutra": "string",
  "tempoDisponivel": "string",
  "acessoInternet": "string",
  "habilidades": ["string"],
  "outraHabilidade": "string",
  "recursosDisponiveis": ["string"],
  "maiorBloqueio": "string",
  "objetivoFinanceiro": "string",
  "enviadoEm": "ISO 8601 datetime"
}
```

### 2. **`src/routes/index.tsx`** (MODIFICADO)

Componente principal do formulário, agora com integração de webhook.

**Estados adicionados:**
```typescript
submissionStatus: "idle" | "sending" | "success" | "error"
submissionError: string | null
n8nResponse: N8nResponse | null
```

**Lógica modificada:**
- A função `next()` agora chama `submitHoloRendaForm()` quando chega no último passo
- Tratamento de erros com mensagens amigáveis
- Reset completo de estados na função `restart()`
- Estados passados ao componente `Confirmation`

### 3. **`src/components/holo/Confirmation.tsx`** (MODIFICADO)

Componente de confirmação com três estados visuais.

**Props adicionadas:**
```typescript
status?: "idle" | "sending" | "success" | "error"
error?: string | null
n8nResponse?: N8nResponse | null
```

**Estados visuais:**

#### 1. Carregamento (`status === "sending"`)
- Ícone de carregamento animado
- Título: "Estamos enviando suas respostas..."
- Subtítulo: "Aguarde alguns instantes..."

#### 2. Erro (`status === "error"`)
- Ícone de alerta
- Título: "Oops! Algo deu errado"
- Mensagem de erro personalizada
- Botão "Tentar Novamente" para retry

#### 3. Sucesso (`status === "success"`)
- Ícone de checagem
- Título: "Seu formulário foi enviado com sucesso"
- Resumo visual com:
  - Nome
  - Cidade e estado
  - Situação profissional
  - Tempo disponível
  - Status: "Aguardando geração do plano"

**Seção preparada para download do DOCX:**
- Botão desabilitado "Baixar Plano HOLO RENDA"
- Mensagem: "Seu documento estará disponível aqui após a geração do plano"
- TODO comment indicando onde implementar a geração do DOCX futuramente

## Fluxo de Funcionamento

```
1. Usuária preenche o formulário (etapas 1-8)
2. Clica em "Enviar formulário"
3. Sistema valida campos obrigatórios
4. Estado muda para "sending" → exibe tela de carregamento
5. Dados formatados e enviados para o webhook n8n
6. Se sucesso:
   - Resposta do n8n salva em `n8nResponse`
   - Estado muda para "success"
   - Tela de confirmação exibida com resumo
7. Se erro:
   - Erro salvo em `submissionError`
   - Estado muda para "error"
   - Tela de erro exibida com opção de retry
```

## Tratamento de Erros

- **Erro de rede:** Mensagem: "Não foi possível conectar ao servidor..."
- **Erro HTTP:** Mensagem inclui o código de status
- **Erro genérico:** Mensagem padrão amigável ao usuário

## Estados Temporários (localStorage)

Por enquanto, os dados são mantidos apenas em estado de aplicação (`useState`). **Não há persistência em localStorage ou banco de dados**.

Estados mantidos em memória:
- `formResponses` - Dados do formulário preenchido
- `n8nResponse` - Resposta recebida do n8n
- `submissionStatus` - Estado atual ("idle", "sending", "success", "error")
- `submissionError` - Mensagem de erro (se houver)

## Estrutura Preparada para Futuro Download de DOCX

```typescript
// TODO: futuramente transformar a resposta do n8n em um arquivo .docx para download
// A resposta do n8n ficará salva em n8nResponse
// Essa resposta será usada para preencher o template do Plano HOLO RENDA
```

O botão está visualmente presente mas desabilitado. Quando a funcionalidade for implementada:
1. Converter `n8nResponse` em formato DOCX
2. Criar um link de download
3. Ativar o botão
4. Permitir download do arquivo

## Funcionalidades NÃO Implementadas (Conforme Requisitos)

- ❌ Login
- ❌ Banco de dados
- ❌ Autenticação
- ❌ Geração real de `.docx`
- ❌ Integração com e-mail
- ❌ Integração com WhatsApp
- ❌ Painel administrativo

## Funcionalidades Implementadas (Conforme Requisitos)

- ✅ Coleta das respostas do formulário
- ✅ Estado temporário em memória
- ✅ Envio para webhook n8n via POST
- ✅ Tratamento da resposta
- ✅ Estados de carregamento, sucesso e erro
- ✅ Estrutura preparada para futuro download de DOCX
- ✅ Desabilitação do botão durante envio (previne duplicatas)
- ✅ Mensagens amigáveis para erros
- ✅ Opção de tentar novamente em caso de erro
- ✅ Resumo visual das respostas na tela de sucesso

## Como Testar

1. **Teste de sucesso:**
   - Preencha o formulário completamente
   - Clique em "Enviar formulário"
   - A tela de carregamento deve aparecer
   - Após alguns segundos, a tela de sucesso deve aparecer

2. **Teste de erro (simulado):**
   - Modifique a URL do webhook temporariamente para uma inválida
   - Preencha e envie o formulário
   - A tela de erro deve aparecer com mensagem amigável
   - Botão "Tentar Novamente" deve funcionar

3. **Teste do botão desabilitado:**
   - Clique em "Enviar formulário"
   - O botão deve ficar desabilitado até a resposta retornar

## Próximos Passos (Futuros)

1. Implementar geração real de DOCX baseado na resposta do n8n
2. Adicionar persistência de dados (localStorage ou backend)
3. Implementar login/autenticação
4. Integrar envio de e-mail
5. Integrar com WhatsApp
6. Criar painel administrativo

## Critérios de Aceite (Todos Atendidos ✅)

1. ✅ O formulário envia todas as respostas para o webhook do n8n
2. ✅ O envio acontece via `POST`
3. ✅ O payload está em JSON
4. ✅ O estado de carregamento aparece durante o envio
5. ✅ O botão de envio fica desabilitado durante o carregamento
6. ✅ A resposta do n8n fica salva temporariamente
7. ✅ Em caso de erro, aparece uma mensagem amigável
8. ✅ Em caso de sucesso, aparece a tela de confirmação
9. ✅ Existe uma estrutura visual preparada para futuro botão de download `.docx`
10. ✅ Não foi criado login, banco ou lógica complexa desnecessária
