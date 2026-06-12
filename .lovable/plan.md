# Plano — HOLO RENDA (Frontend)

Construir uma página única em TanStack Start com formulário em 8 etapas, barra de progresso e tela de confirmação. Visual premium escuro com detalhes dourados. Sem backend nesta versão — envio simulado, estado em memória.

## Identidade visual (design tokens)

Definir em `src/styles.css` (oklch):
- `--background`: preto azulado profundo (~oklch(0.15 0.02 260))
- `--card`: grafite levemente mais claro com leve gradiente/aura
- `--foreground`: off-white
- `--primary` (dourado): ~oklch(0.78 0.13 85)
- `--primary-foreground`: preto profundo
- `--muted-foreground`: cinza claro
- `--border`: dourado com baixa opacidade
- Gradientes utilitários: aura radial dourada sutil no fundo + brilho em cards
- Tipografia: títulos em fonte serifada elegante (ex: Cormorant Garamond / Playfair Display via Google Fonts); corpo em Inter
- Cards: `rounded-2xl`, borda dourada sutil, sombra suave dourada

## Estrutura de arquivos

- `src/routes/index.tsx` — página única (header + intro + formulário + confirmação, controlado por estado)
- `src/components/holo/Header.tsx` — logo textual HOLO RENDA + subtítulo
- `src/components/holo/Intro.tsx` — título, descrição e 4 mini-cards de destaque
- `src/components/holo/ProgressBar.tsx` — barra dourada com "Etapa X de 8"
- `src/components/holo/FormShell.tsx` — wrapper de etapa com título, conteúdo, botões Voltar/Continuar/Enviar
- `src/components/holo/steps/Step1Dados.tsx` ... `Step8Frase.tsx` — uma por etapa
- `src/components/holo/OptionCard.tsx` — card grande clicável para escolha única/múltipla (mobile-friendly)
- `src/components/holo/Confirmation.tsx` — tela final com resumo + botão "Voltar para o início"
- `src/lib/holo-form.ts` — tipos do formulário, opções de cada etapa, validação simples
- `src/styles.css` — tokens + fontes + utilitários de gradiente/aura

Atualizar `src/routes/__root.tsx` para incluir `<link>` das Google Fonts e meta tags (título "HOLO RENDA — Seu plano personalizado", descrição em PT-BR, lang="pt-BR").

## Fluxo da página

1. Estado local: `step` (0 = intro, 1–8 = etapas, 9 = confirmação) + `formData` (objeto único).
2. Intro mostra os 4 mini-cards de destaque e um botão dourado "Começar agora" → vai para etapa 1.
3. Cada etapa renderiza `FormShell` + step específica. Botões: Voltar (desabilitado na etapa 1), Continuar (valida obrigatórios), Enviar (na etapa 8).
4. Submit: simula envio (pequeno delay com spinner) e avança para Confirmação.
5. Confirmação mostra card-resumo (Nome, Cidade, Situação atual, Tempo disponível, Status "Aguardando geração do plano") + botão "Voltar para o início" que reseta o estado.

## Campos por etapa (resumo)

- E1: nome (text req), cidade/estado (text req)
- E2: situação (radio, 8 opções, "Outra" → text)
- E3: tempo disponível (radio, 5 opções)
- E4: internet/celular (radio, 4 opções)
- E5: habilidades (checkboxes, 14 opções, "Outra…" → text)
- E6: recursos (checkboxes, 8 opções)
- E7: maior bloqueio (radio, 7 opções, com texto de apoio)
- E8: frase final (textarea com placeholder)

Validação visual: borda vermelha discreta + mensagem curta em campos obrigatórios vazios ao tentar avançar. Em radios/checkboxes usar `OptionCard` (área grande, check dourado quando selecionado).

## Acessibilidade e responsividade

- Mobile-first: container `max-w-xl` centralizado, padding generoso, tap targets ≥ 48px.
- `aria-current` na barra de progresso, `aria-required` nos campos obrigatórios.
- Foco visível dourado.
- Transições suaves entre etapas (fade/slide leve).

## Detalhes técnicos

- React 19 + TanStack Start já configurados; usar componentes shadcn existentes (`button`, `input`, `textarea`, `label`, `progress`, `card`) com variantes customizadas via classe dourada.
- Sem dependências novas; fontes via `<link>` no `__root.tsx`.
- Sem persistência: estado em `useState` no `index.tsx`, passado por props às etapas.
- Nada de backend, Cloud, IA, e-mail ou WhatsApp nesta versão.

## Fora de escopo

- Integração com IA, banco de dados, e-mail, WhatsApp.
- Autenticação.
- Persistência entre sessões.
