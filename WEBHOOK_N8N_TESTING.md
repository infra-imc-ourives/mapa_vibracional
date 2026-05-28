# Guia de Testes - Integração HOLO RENDA com Webhook n8n

Este documento descreve como testar a integração do webhook n8n com a aplicação HOLO RENDA.

## Testes Funcionais

### Teste 1: Envio Bem-Sucedido do Formulário

**Passos:**
1. Abra a aplicação no navegador
2. Preencha o formulário com dados válidos em todas as 8 etapas
3. Clique em "Enviar formulário" na última etapa

**Resultado Esperado:**
- [ ] Botão "Enviar formulário" fica desabilitado
- [ ] Tela de carregamento aparece com:
  - [ ] Ícone de carregamento animado
  - [ ] Título: "Estamos enviando suas respostas..."
  - [ ] Subtítulo: "Aguarde alguns instantes..."
- [ ] Após alguns segundos, tela de sucesso aparece com:
  - [ ] Ícone de checagem
  - [ ] Título: "Seu formulário foi enviado com sucesso"
  - [ ] Resumo com: Nome, Cidade, Situação, Tempo disponível
  - [ ] Status: "Aguardando geração do plano"
  - [ ] Seção de download (desabilitada)
  - [ ] Botão "Voltar para o início"

**Como verificar:**
- Abra o DevTools (F12)
- Vá para a aba "Network"
- Observe a requisição POST para `n8n-ia-webhook.elainneourives.com.br/webhook/holorenda`
- Verifique o payload no corpo da requisição

### Teste 2: Erro de Conexão

**Passos:**
1. Desabilite a conexão de internet (ou use um proxy para bloquear)
2. Preencha o formulário
3. Clique em "Enviar formulário"

**Resultado Esperado:**
- [ ] Tela de carregamento aparece
- [ ] Após alguns segundos, tela de erro aparece com:
  - [ ] Ícone de alerta
  - [ ] Título: "Oops! Algo deu errado"
  - [ ] Mensagem de erro: "Não foi possível conectar ao servidor..."
  - [ ] Botão "Tentar Novamente"

**Como verificar:**
- Verifique no console (F12) se há erro de fetch

### Teste 3: Erro do Servidor (HTTP 5xx)

**Passos:**
1. Coloque o webhook do n8n offline (ou simule com proxy)
2. Preencha e envie o formulário

**Resultado Esperado:**
- [ ] Tela de erro aparece com mensagem incluindo o código HTTP
- [ ] Mensagem inclui "Erro ao enviar formulário: HTTP [código]"
- [ ] Botão "Tentar Novamente" funciona

### Teste 4: Tentar Enviar Novamente (Retry)

**Passos:**
1. Simule um erro conforme o Teste 2 ou 3
2. Clique em "Tentar Novamente"
3. Deixe a conexão normal
4. O formulário deve ser reenviado

**Resultado Esperado:**
- [ ] Tela de carregamento aparece novamente
- [ ] Se bem-sucedido, tela de sucesso aparece
- [ ] Se falhar novamente, tela de erro reaparece

### Teste 5: Validação de Campos Obrigatórios

**Passos:**
1. Preencha todas as etapas do formulário normalmente
2. Na última etapa, limpe o campo "Sua frase final"
3. Clique em "Enviar formulário"

**Resultado Esperado:**
- [ ] Mensagem de erro: "Escreva sua frase para finalizar."
- [ ] Formulário NÃO é enviado para o webhook
- [ ] Nenhuma tela de carregamento aparece

### Teste 6: Botão Desabilitado Durante Envio

**Passos:**
1. Preencha o formulário
2. Clique em "Enviar formulário"
3. Imediatamente, tente clicar novamente no botão

**Resultado Esperado:**
- [ ] Botão fica desabilitado (cinzento/opaco)
- [ ] Texto muda para "Enviando..."
- [ ] Múltiplos cliques não causam múltiplos envios
- [ ] Botão é reabilitado após resposta

### Teste 7: Reiniciar Aplicação (Voltar para o Início)

**Passos:**
1. Complete o fluxo com sucesso
2. Na tela de sucesso, clique em "Voltar para o início"

**Resultado Esperado:**
- [ ] Aplicação volta para a intro (step 0)
- [ ] Formulário é zerado
- [ ] Estados de envio são resetados
- [ ] Todos os dados temporários são limpos

### Teste 8: Estrutura do Payload

**Passos:**
1. Abra DevTools (F12) → Network
2. Preencha e envie o formulário
3. Na aba Network, procure pela requisição POST
4. Clique nela e vá para "Request" → "Payload"

**Resultado Esperado:**
O payload deve conter exatamente:
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

- [ ] Verificar que `enviadoEm` está em formato ISO (ex: "2026-05-21T14:30:00.000Z")
- [ ] Verificar que todos os campos estão preenchidos
- [ ] Verificar que arrays estão corretamente formatados

### Teste 9: Headers da Requisição

**Passos:**
1. Abra DevTools → Network
2. Envie o formulário
3. Na requisição POST, clique em "Headers"

**Resultado Esperado:**
- [ ] Header `Content-Type: application/json` está presente
- [ ] Método é `POST` (não GET)
- [ ] URL é `http://n8n-ia-webhook.elainneourives.com.br/webhook/holorenda`

### Teste 10: Dados Especiais - Situação "Outra"

**Passos:**
1. No formulário, etapa 2, escolha "Outra" para situação profissional
2. Preencha o campo de texto com: "Sou consultora de imagem"
3. Complete o formulário e envie

**Resultado Esperado:**
- [ ] No payload, `situacaoProfissional` deve conter: "Sou consultora de imagem"
- [ ] `situacaoProfissionalOutra` também deve conter: "Sou consultora de imagem"
- [ ] No resumo de sucesso, deve aparecer: "Sou consultora de imagem"

### Teste 11: Múltiplas Seleções - Habilidades

**Passos:**
1. Na etapa 5, selecione 3 habilidades (ex: "Cozinhar bem...", "Costurar...", "Criar conteúdo...")
2. Complete e envie

**Resultado Esperado:**
- [ ] No payload, `habilidades` deve ser um array com 3 elementos
- [ ] Todos os valores selecionados devem estar no array
- [ ] Ordem pode variar, mas todos devem estar

### Teste 12: Habilidade Outra + Campo de Texto

**Passos:**
1. Na etapa 5, selecione "Outra habilidade importante"
2. Preencha com: "Domador de animais selvagens"
3. Envie

**Resultado Esperado:**
- [ ] No array `habilidades`, incluir "Outra habilidade importante"
- [ ] Campo `outraHabilidade` deve conter: "Domador de animais selvagens"

### Teste 13: Responsividade em Dispositivos Móveis

**Passos:**
1. Abra DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Teste em diferentes tamanhos de tela (iPhone, iPad, Android)
3. Complete um formulário em cada resolução

**Resultado Esperado:**
- [ ] Formulário é responsivo em mobile
- [ ] Botões são clicáveis (não muito pequenos)
- [ ] Texto é legível
- [ ] Telas de carregamento/erro/sucesso adaptem ao tamanho
- [ ] Nenhum elemento fica fora da tela

### Teste 14: Performance - Tempo de Resposta

**Passos:**
1. Abra DevTools → Network
2. Throttle a conexão para "Fast 3G"
3. Envie o formulário

**Resultado Esperado:**
- [ ] UX continua funcional mesmo com conexão lenta
- [ ] Tela de carregamento é exibida adequadamente
- [ ] Após 5-10 segundos, resultado é exibido
- [ ] Nenhum timeout não tratado

### Teste 15: Console Sem Erros

**Passos:**
1. Abra DevTools → Console
2. Complete todo o fluxo do formulário
3. Verifique se há erros em vermelho

**Resultado Esperado:**
- [ ] Nenhum erro em vermelho aparece
- [ ] Apenas avisos de tipo (warnings em amarelo) podem aparecer
- [ ] Logs (em azul) podem aparecer com informações de debug

## Casos de Teste Edge Cases

### Teste 16: Caracteres Especiais no Nome

**Passos:**
1. Preencha nome com: "José da Silva-Rodrigues"
2. Complete e envie

**Resultado Esperado:**
- [ ] Especialmente hífens, acentos e apóstrofos são enviados corretamente
- [ ] No payload, aparece exatamente: "José da Silva-Rodrigues"

### Teste 17: Campos com Espaços em Branco

**Passos:**
1. Preencha nome com espaços antes/depois: "  João  "
2. Envie

**Resultado Esperado:**
- [ ] Espaços em branco são trimmed (removidos)
- [ ] Ou espaços são preservados conforme o design

### Teste 18: Resposta n8n Grande

**Passos:**
1. Configure o n8n para retornar um objeto grande (>1MB)
2. Envie o formulário

**Resultado Esperado:**
- [ ] Aplicação não trava
- [ ] Resposta é processada corretamente
- [ ] Sem problemas de memória

### Teste 19: Refresh Durante Envio

**Passos:**
1. Clique em "Enviar formulário"
2. Imediatamente pressione F5 (refresh)

**Resultado Esperado:**
- [ ] Aplicação recarrega sem erros
- [ ] Página volta ao estado inicial (intro)
- [ ] Nenhum erro crítico ocorre

### Teste 20: Voltar com Browser Back Button

**Passos:**
1. Complete o formulário com sucesso
2. Clique no botão "Voltar" do navegador

**Resultado Esperado:**
- [ ] Aplicação trata o "back" corretamente
- [ ] Não causa erros
- [ ] Comportamento esperado (pode ir para página anterior ou manter estado)

## Checklist de Testes Concluídos

- [ ] Teste 1: Envio bem-sucedido
- [ ] Teste 2: Erro de conexão
- [ ] Teste 3: Erro do servidor
- [ ] Teste 4: Retry
- [ ] Teste 5: Validação de campos
- [ ] Teste 6: Botão desabilitado
- [ ] Teste 7: Voltar para início
- [ ] Teste 8: Estrutura do payload
- [ ] Teste 9: Headers
- [ ] Teste 10: Situação "Outra"
- [ ] Teste 11: Múltiplas seleções
- [ ] Teste 12: Outra habilidade
- [ ] Teste 13: Responsividade mobile
- [ ] Teste 14: Performance
- [ ] Teste 15: Console sem erros
- [ ] Teste 16: Caracteres especiais
- [ ] Teste 17: Espaços em branco
- [ ] Teste 18: Resposta grande
- [ ] Teste 19: Refresh durante envio
- [ ] Teste 20: Browser back button

## Notas para Desenvolvedores

- Use o DevTools constantemente para inspecionar o payload
- Verifique o Network tab para confirmar as requisições
- Console deve estar limpo de erros (warnings são aceitáveis)
- Teste em diferentes navegadores se possível
- Use throttling para simular conexões lentas
