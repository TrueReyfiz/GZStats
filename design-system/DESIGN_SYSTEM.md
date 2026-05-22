# Gorillaz Hub — Design System

> Dashboard interno do squad **The Gorillaz** (LoL — BR1 Flex) para acompanhar Elo, KDA, winrate e a resenha do dia. Esse projeto centraliza guidelines visuais, tokens, assets e UI kits para qualquer designer ou agente que vá produzir telas, slides ou novas features do Gorillaz Hub.

**Fonte original:** [github.com/TrueReyfiz/GZStats](https://github.com/TrueReyfiz/GZStats) — explore o repo para entender a stack real (FastAPI + React + Tailwind + Recharts) antes de propor mudanças. Esse Design System foi extraído da branch `main` do front-end.

---

## ÍNDICE

| Arquivo                           | O que tem dentro                                               |
| --------------------------------- | -------------------------------------------------------------- |
| `colors_and_type.css`             | Todas as variáveis CSS — cores, fontes, escalas, sombras       |
| `assets/`                         | Logos, wordmark, badge do squad, padrões HUD, hero banner      |
| `preview/`                        | Cards do Design System (registrados na aba do projeto)         |
| `ui_kits/gorillaz-hub/`           | Recreação interativa do app — sidebar, ranking, perfil, etc.   |
| `source/`                         | Cópia read-only do código original do GZStats (referência)     |
| `SKILL.md`                        | Plug-in para Claude / Claude Code rodar designs novos          |

---

## 1. CONTEXTO DO PRODUTO

**Gorillaz Hub** (também conhecido como **GZStats** no código) é um web app interno de um grupo de amigos que joga League of Legends — squad The Gorillaz, BR1, fila Flex. O backend (FastAPI + RiotWatcher) consome a Riot API e calcula:

- Elo / Tier / LP de cada jogador
- KDA médio, CS/min, DPM, Vision Score, GD@15, KP%
- Histórico de partidas individual
- Snapshots diários de evolução do time
- Alertas automáticos de "🔥 hot streak" e "⚠️ tilt"

**Único produto** atualmente: web app responsivo (desktop-first com breakpoints sm/md/lg), navegável em 4 páginas:

1. **Ranking** — tabela ordenável do squad (rota raiz)
2. **Perfil** — stats + histórico de um jogador (`/jogador/:puuid`)
3. **Comparativo** — gráfico de barras + tabela de todas as métricas
4. **Evolução** — linhas temporais de LP / stats / média do time

O tom não é corporativo: é dashboard de "resenha entre amigos" — elege MVPs e *trolls* da rodada, celebra hot streaks, alfineta quem tá em tilt.

---

## 2. CONTENT FUNDAMENTALS

### Idioma e tom

- **Português brasileiro, informal, gíria de jogador.** Termos em inglês não são traduzidos quando são jargão do jogo (`KDA`, `LP`, `winrate`, `hot streak`, `tilt`, `KP`, `vision score`, `GD@15`, `DPM`, `CS/min`, `top`, `jungle`, `mid`, `bot`, `sup`).
- **Pronome**: o app fala *do* time, não *com* o jogador. Headlines tipo "Ranking **do Time**", "Comparativo **do Time**", "Evolução **do Time**" — o "do Time" sempre destacado em cyan. Não usa "você" nem "seu" para o usuário; trata os jogadores em terceira pessoa pelo `riot_id`.
- **Resenha permitida**: o produto se descreve como "resenha entre amigos" e elege "MVPs e trolls da rodada" — copy nova pode ter humor de squad, sem PG-13 forçado, mas sem palavrão gratuito.
- **Concisão**: labels de UI são curtos. "Buscar jogador…", "Carregando…", "Nenhum jogador encontrado com esses filtros.", "Sem partidas registradas ainda."

### Casing

- **EYEBROW LABELS** (`text-xs uppercase tracking-widest`): seções, colunas de tabela, filtros — `RANKING`, `ROTA`, `RESULTADO`, `TIER`. Sempre PT-BR.
- **Title Case do Display**: títulos de página usam capitalização normal em PT-BR ("Ranking do Time", "Comparativo do Time").
- **CAPS em estatísticas curtas**: `KDA`, `LP`, `WR%`, `DPM`, `CS/m`, `GD@15` — sempre maiúsculas, sem ponto.
- **Sem `.` no final de labels.** Frases completas (estados vazios, tooltips) levam pontuação normal.

### Eu vs você

- App não fala "você". Quando precisa direcionar ("clique no cabeçalho para ordenar"), usa **imperativo neutro** ou frase descritiva ("Clique no cabeçalho para ordenar", "Selecionar métrica").

### Exemplos canônicos (extraídos do código)

| Contexto             | Copy                                                            |
| -------------------- | --------------------------------------------------------------- |
| H1                   | `Ranking do Time` · `Evolução do Time` · `Comparativo do Time`  |
| Subhead              | `Ranked Flex · BR1 · 5 jogadores · stats das últimas 50 partidas` |
| Loading              | `Carregando...`                                                 |
| Empty state          | `Nenhum jogador encontrado com esses filtros.`                  |
| Empty (perfil)       | `Sem partidas registradas ainda. Aguarde a sincronização automática.` |
| Empty (gráfico)      | `Sem histórico de LP para o período selecionado.`               |
| Alerta tilt          | `⚠️ Player em tilt — 4 derrotas seguidas`                       |
| Alerta hot streak    | `🔥 Em sequência!`                                              |
| Filtro de resultado  | `✅ Vitórias` / `❌ Derrotas` / `Todos`                          |
| Tooltip de coluna    | `Clique no cabeçalho para ordenar`                              |
| Stats sub-label      | `últ. 30 partidas` · `ouro vs oponente` · `CS vs oponente`      |

### Emoji — uso atual e regra

O código original **usa emoji** como ícones de feature: ⚔️ (logo), 🔍 (busca), 🔥 (hot streak), ✅ (vitória), ❌ (derrota), ⚠️ (tilt), 📈 📊 🌐 (abas), ▲ ▼ (delta). Faz parte do tom de resenha.

- **OK**: emoji semântico colado em label curto (`🔥 Em sequência!`).
- **Não OK**: emoji decorativo em headlines ou copy longa. Não polui interfaces densas (tabelas) com emoji por linha — só onde há informação real (hot streak por jogador, sim; vitória/derrota dentro de filtro, sim).
- **Caminho de longo prazo (recomendado)**: substituir emoji por ícones SVG do **Lucide** quando quisermos um visual mais polido. Veja [ICONOGRAPHY](#5-iconography).

### Vibe geral

Esports HUD + resenha de Discord. Dark mode obrigatório, métricas como cidadã de primeira classe (números monoespaçados, cores semânticas), e o squad acima do indivíduo (cores quentes para o time, frias para o jogador).

---

## 3. VISUAL FOUNDATIONS

### 3.1 Cores

Veja `colors_and_type.css` para o conjunto completo. Resumo:

| Token              | Hex        | Uso                                                       |
| ------------------ | ---------- | --------------------------------------------------------- |
| `--bg-0`           | `#080b10`  | Background da página — quase-preto com pincelada azul     |
| `--bg-1`           | `#0d1117`  | Card / superfície primária                                |
| `--bg-2`           | `#131a23`  | Hover / nested                                            |
| `--cyan-400`       | `#22d3ee`  | **PRIMÁRIO** — ações, links ativos, jogador focado        |
| `--gold-400`       | `#fbbf24`  | **SECUNDÁRIO** — wordmark, destaques LoL-flavored         |
| `--violet-400`     | `#a78bfa`  | **TERCIÁRIO** — métricas agregadas do time                |
| `--win`            | `#34d399`  | Vitórias, deltas positivos                                |
| `--loss`           | `#f87171`  | Derrotas, deltas negativos                                |
| `--warn`           | `#fb923c`  | Alertas hot streak                                        |
| `--tilt`           | `#ef4444`  | Alertas de tilt                                           |
| `--tier-*`         | (vários)   | 10 cores fixas por tier de LoL — `IRON` a `CHALLENGER`    |

**Regras:**
- Backgrounds são SEMPRE escuros. Não existe modo claro. Não invente um.
- Borda padrão é `rgba(255,255,255,0.05)` — quase invisível. Hover sobe para `0.10` ou `0.20`.
- Acentos sempre aparecem em pares **cor + cor/10 de fundo** (`text-cyan-400` + `bg-cyan-400/10`) para criar capsules pílula.
- Tier colors são fixos por LoL — não substitua.

### 3.2 Tipografia

| Família         | Uso                                              | Substituição |
| --------------- | ------------------------------------------------ | ------------ |
| **Chakra Petch** | Display: H1, H2, wordmark, números grandes        | ⚠️ Sub-stituída — repo original usava font system. Chakra Petch foi escolhida para dar feel esports/HUD. **Confirme se você gosta ou peça outra.** |
| **Inter**        | Body, labels, UI text                            | Padrão moderno |
| **JetBrains Mono** | Números (KDA, LP, %), tabelas de stats           | Tabular nums |

Escala completa em `colors_and_type.css` (`--fs-xs` 11px → `--fs-display` 44px). Eyebrow labels (`gh-eyebrow`) usam `letter-spacing: 0.18em` para parecer HUD.

### 3.3 Spacing & layout

- **Grid base 4px.** Múltiplos canônicos: 4 · 8 · 12 · 16 · 24 · 32.
- **Container principal**: `max-w-6xl` (1152px) centralizado, padding lateral 16px.
- **Navbar fixa no topo**: altura 56px, `border-bottom` faint, backdrop-blur sutil sobre `bg-0/90`.
- **Cards**: padding interno 16–24px, gap entre cards 12–16px.
- **Tabelas**: linhas com `py-3 px-4`, `border-b border-white/5` por linha, sem zebra.

### 3.4 Backgrounds & motivos visuais

- **Fundo da página**: cor sólida `--bg-0`. Sem gradientes globais.
- **Hero / banner opcional**: o asset `assets/hero-bg.svg` aplica um grid HUD + brackets + crosshair central — use moderadamente em headers de seção, NÃO no app inteiro.
- **Pattern decorativo**: `assets/pattern-hud.svg` para empty states ou cantos vazios.
- **Sem ilustração desenhada à mão.** Sem foto. Imagery do squad real, quando entrar, devem ser avatares dos jogadores (placeholders por enquanto — pedir ao usuário).

### 3.5 Animação

- **Movimento sutil, sempre.** `transition-all 200ms` é o default tailwind do código.
- **Easing**: `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) para entradas, default para hover.
- **Pulse**: indicador "Online" usa `animate-pulse` (dot verde). Hot streak NÃO anima — só emoji estático.
- **Sem bounces, sem shimmer carregando, sem confete.** Loading é tipográfico: `Carregando...`.

### 3.6 Estados de interação

- **Hover (botões/links neutros)**: `text-slate-200 hover:bg-white/5` — clareia o texto + fundo white/5.
- **Hover (chip ativo possível)**: `border-white/10 hover:border-white/20` — só engrossa a borda.
- **Hover (row de tabela)**: `hover:bg-white/[0.03]` — sutilíssimo.
- **Active / selecionado**: `text-cyan-400 bg-cyan-400/10 border-cyan-400/30` — sempre o tripleto (texto + bg + borda).
- **Focus em input**: `focus:outline-none focus:border-cyan-400/50` — borda fica cyan a 50%, sem ring.
- **Press**: o código não tem press states explícitos. Recomendação: `active:scale-[0.98] active:bg-cyan-400/20`.
- **Disabled**: `text-slate-600 cursor-not-allowed opacity-50`.

### 3.7 Borders, radii & shadow

- **Radii canônicos**: 4 (`--r-sm`), 6 (`--r-md`), 8 (`--r-lg`), 12 (`--r-xl`), pill para chips redondos.
- **Cards**: sempre `rounded-lg` (8px) + `border border-white/5`. NUNCA `rounded-2xl` ou maior — o feel é HUD, não fofo.
- **Shadow**: o código original não usa shadow em cards (só borda + bg). Mantenha assim em geral. Para modais/popovers eleve com `--shadow-pop`.
- **Glow cyan** (`--glow-cyan`): para um CTA dramático ou um elemento em foco. Use raro.

### 3.8 Transparência & blur

- Navbar usa `backdrop-blur` sobre `bg-0/90`. Único lugar com blur no app.
- Capsules de status (`bg-cyan-400/10`, `bg-win-bg`, etc) são translúcidos por design — eles vivem em superfícies escuras.
- Tooltips de chart: `bg-[#0d1117] border border-white/10` — opaco, sem blur.

### 3.9 Elementos fixos / layout rules

- **Navbar fixa** no topo (`z-50`), com offset `pt-16` no main.
- **Conteúdo**: max-width 1152px, `mx-auto`, padding 16px lateral.
- **Indicador "Online"** sempre na direita da navbar com dot verde pulsando.
- **Botão de voltar** em páginas de detalhe: link textual "← Voltar ao Ranking", `text-xs text-slate-500`.

### 3.10 Vibe das imagens

Quando o app eventualmente tiver fotos:
- **Cool tones**, alto contraste, dark backgrounds.
- Avatares circulares com borda fina na cor do tier do jogador (`border-2 border-current` + `text-[tier-color]`).
- Sem warmth dourada de "stock photo". O feel é tela de OBS, não Instagram.

---

## 4. ICONOGRAPHY

### Estado atual no repo

O GZStats original **não tem um icon system**: usa emoji nativos do sistema operacional para tudo (⚔️ 🔍 🔥 ✅ ❌ ⚠️ 📈 📊 🌐 ▲ ▼). Funciona pra MVP de squad, mas é frágil:
- Renderização inconsistente entre OS/browser (Apple emoji vs Twemoji vs Windows).
- Sem controle de cor/tamanho fino.
- Mistura mal com UI densa (tabelas, headers).

### Recomendação canônica

**Adotar [Lucide](https://lucide.dev) via CDN** (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`) — substituição direta de cada emoji por um ícone SVG monocromático stroke 1.5px:

| Emoji atual | Lucide       | Uso                              |
| ----------- | ------------ | -------------------------------- |
| ⚔️          | `swords`     | Logo / wordmark                  |
| 🔍          | `search`     | Input de busca                   |
| 🔥          | `flame`      | Hot streak                       |
| ✅          | `check-circle` | Vitória                       |
| ❌          | `x-circle`   | Derrota                          |
| ⚠️          | `alert-triangle` | Alerta tilt                  |
| 📈          | `trending-up` | Aba LP                          |
| 📊          | `bar-chart-3` | Aba Stats                       |
| 🌐          | `globe`      | Aba time                        |
| ▲ ▼         | `chevron-up` / `chevron-down` | Sort, deltas    |
| ↕ ↑ ↓       | `arrow-up-down` / `arrow-up` / `arrow-down` | Sort indicator |

**Substituição flagged** — o repo original usa emoji; eu (designer) **recomendo migrar para Lucide** mas isso é uma proposta visual. Se o time preferir o vibe emoji, mantenha — mas seja consistente: ou tudo emoji, ou tudo SVG, sem mix.

### Assets locais (SVG do design system)

- `assets/logo-wordmark.svg` — wordmark "GORILLAZ HUB" + chevron brackets
- `assets/logo-mark.svg` — monogram "GZ" em badge quadrado com cantos de bracket
- `assets/squad-badge.svg` — emblema do squad (crossed swords + gorilla geométrico)
- `assets/hero-bg.svg` — banner HUD para headers de seção
- `assets/pattern-hud.svg` — pattern decorativo para empty states

### Imagens de jogador

Não existem ainda. **Pedido ao usuário**: subir avatares dos jogadores ou apontar uma URL (Riot CDN tem `profileIconId`s — backend já guarda). Enquanto isso, fallback usa inicial do `riot_id` dentro de círculo com borda na cor do tier (padrão atual no Perfil).

---

## 5. UI KITS

Veja `ui_kits/gorillaz-hub/` para a recreação interativa do app:

- `index.html` — protótipo navegável (Ranking → Perfil → Comparativo → Evolução)
- `Navbar.jsx`, `RankingTable.jsx`, `PlayerCard.jsx`, `StatCard.jsx`, `TierBadge.jsx`, `FilterChip.jsx`, `AlertBanner.jsx` — componentes JSX modulares

Cada componente é cosmético (não conecta com API real); use como referência visual ao construir telas novas.

---

## CAVEATS & ABERTAS PARA O USUÁRIO

**Substituições que precisam de confirmação:**

1. **Fontes**: Chakra Petch (display) + Inter (body) + JetBrains Mono (stats) foram **escolha minha** — o repo original não definia nenhuma. Se preferir Rajdhani, Orbitron, Space Grotesk, ou algo mais "marca pessoal", me avisa que eu troco em um arquivo só.
2. **Wordmark**: criei do zero ("GORILLAZ HUB" em ouro + cyan com chevrons). Se o squad já tem um logo desenhado, manda que eu substituo `assets/logo-*.svg`.
3. **Iconography**: recomendo migrar de emoji → Lucide, mas isso muda o tom (mais polido, menos resenha). Decisão sua.
4. **Avatares**: ainda não existem. Como você quer representar os jogadores? Profile icon da Riot? Foto real? Avatar gerado?
5. **Estilo próprio do squad**: você pediu sugestões. Minhas propostas estão concretizadas neste sistema (esports HUD + gold accent + chevron motif). **Posso explorar 2-3 direções alternativas em uma `design_canvas`** se você quiser comparar lado a lado — por exemplo: (a) HUD atual, (b) brutalista/retro arcade, (c) cyberpunk neon com gradientes. Diz se topa.

Para iterar, basta apontar qualquer card no preview ou qualquer arquivo aqui — eu mudo só o necessário.
