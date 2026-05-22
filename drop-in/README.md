# Direção D — Resenha · Drop-in production code

Pasta pronta pra você arrastar pra dentro do seu repo `GZStats`. Todas as páginas consomem **o backend FastAPI que já existe** via `services/api.js` (não mexi nele).

---

## Como aplicar no seu repo

A partir da raiz do `GZStats`:

```bash
# 1. Backup do estado atual (vai que precisa voltar)
git checkout -b direcao-d-resenha

# 2. Copia os SVGs do mascote pra public/
cp production/public/*.svg frontend/public/

# 3. Substitui os arquivos do front
cp production/tailwind.config.js  frontend/tailwind.config.js
cp production/src/index.css       frontend/src/index.css
cp production/src/App.jsx         frontend/src/App.jsx

# 4. Cria as novas pastas e copia
mkdir -p frontend/src/lib
cp production/src/lib/brand.js    frontend/src/lib/brand.js

cp production/src/components/*.jsx frontend/src/components/
cp production/src/pages/*.jsx      frontend/src/pages/

# 5. Roda
cd frontend
npm install     # nada novo, mas vai te garantir
npm run dev
```

A rota nova `/vergonha` (Hall da Vergonha) já aparece na nav. Pra remover, basta tirar a entrada no array `NAV` em `components/Navbar.jsx` e o `<Route>` em `App.jsx`.

---

## O que mudou

### Estrutura

```
src/
├── App.jsx                   ← +1 rota (/vergonha), wrapper layout novo
├── index.css                 ← fonts + CSS vars + body bg (substitui o teu)
├── lib/
│   └── brand.js              ← NOVO: tokens, helpers (tierBg, fmtDiff, etc)
├── components/
│   ├── Navbar.jsx            ← Reescrito (mascote, NavLink em pill banana)
│   ├── ResenhaCards.jsx      ← NOVO: MVP da rodada + Troll do dia
│   ├── PlayerCard.jsx        ← NOVO: substitui as linhas da tabela antiga
│   ├── MatchRow.jsx          ← NOVO: linha de partida no histórico
│   ├── StatBox.jsx           ← NOVO: stat tile do perfil
│   ├── TierPill.jsx          ← NOVO: capsule de rank LoL
│   ├── Avatar.jsx            ← NOVO: avatar redondo com inicial
│   ├── Chip.jsx              ← NOVO: filter chip banana
│   ├── SectionHeader.jsx     ← NOVO: H2 + banana decoration
│   └── AlertBanner.jsx       ← NOVO: tilt / hot streak banner
├── pages/
│   ├── Ranking.jsx           ← Reescrito (grid de PlayerCards, não tabela)
│   ├── Perfil.jsx            ← Reescrito (hero + grid de StatBoxes + MatchRow)
│   ├── Comparativo.jsx       ← Reescrito (Recharts mantido, paleta nova)
│   ├── Evolucao.jsx          ← Reescrito (Recharts mantido, paleta nova)
│   └── HallVergonha.jsx      ← NOVO: ranking inverso por "shame score"
├── services/
│   └── api.js                ← INTACTO (não mexi)
└── main.jsx                  ← INTACTO
```

### Configuração do Tailwind

O `tailwind.config.js` novo estende o tema com:

- **Fontes**: `font-display` (Bowlby One), `font-body` (Nunito), `font-mono` (DM Mono) — carregadas via Google Fonts no topo do `index.css`.
- **Cores**: paleta da Direção D (`bg-bg-0/1/2/3`, `text-cream`, `text-warm-3/4/5`, `bg-banana`, `bg-jungle`, `bg-clay`, `text-berry`, `text-win/loss/warn`) + tier colors (`text-tier-gold` etc).
- **Radii**: `rounded-md` virou 14px (cards), `rounded-lg` 20px (panels).
- **Sombras**: `shadow-card` (sombra empilhada estilo cartoon), `shadow-sticker` (resenha cards), `shadow-pill` (botão banana).
- **Animação**: `animate-bounce` reaproveitada com um curve mais suave.

---

## API esperada

Tudo consome o `services/api.js` que você já tem. Os campos lidos:

| Endpoint              | Campos usados                                                          |
| --------------------- | ---------------------------------------------------------------------- |
| `getJogadores()`      | `puuid, riot_id, tag_line, tier, rank, lp, wins, losses, winrate, kda_medio, dpm_medio, hot_streak, gd15_medio, rota_principal?` |
| `getPerfil(puuid)`    | tudo do acima + `stats_medios: { kda_medio, cspm_medio, dpm_medio, kp_medio, visao_medio, gd15_medio, csd15_medio, winrate_recente, partidas_analisadas }` |
| `getPartidas(puuid)`  | `match_id, vitoria, campeao, rota, duracao_min, kills, deaths, assists, kda, cs, cspm, gd15`              |
| `getComparativo()`    | `puuid, riot_id, tier, rank, kda, cspm, dpm, kp, visao, winrate, gd15, partidas_analisadas, rota_principal?` |
| `getEvolucao(puuid, dias)`      | `[{ registrado_em, lp, lp_absoluto? }, ...]` |
| `getEvolucaoStats(puuid, dias)` | `[{ registrado_em, kda, cspm, dpm, visao, kp, winrate, gd15, xpd15, csd15 }, ...]` |
| `getEvolucaoTime(dias)`         | `[{ data, kda, cspm, dpm, visao, kp, winrate, gd15, xpd15, csd15 }, ...]` |
| `getAlertas()`        | `[{ tipo: 'tilt'|'hot', mensagem }, ...]` |

> Campo opcional novo: `rota_principal` no objeto de jogador. Se o backend ainda não fornece, o frontend simplesmente esconde o `· Mid/JG/Top/etc`. **Não quebra nada se faltar.**

---

## Lógica do MVP / Troll / Vergonha (parte do front)

- **MVP da rodada** (`Ranking.jsx`): escolhe o jogador com `hot_streak: true` que tem a melhor combinação de KDA+WR; fallback pro melhor da lista.
- **Troll do dia** (`Ranking.jsx`): pior combinação KDA+WR da lista.
- **Score de vergonha** (`HallVergonha.jsx`): `KDA·10 + GD@15/20 + WR` — fórmula simples, fácil de ajustar.

**Quotes** ("Carregou a partida no Mid…", "Bora pausar antes que o tilt…") estão hardcoded como fallback nos componentes. Se quiser, posso:
- (a) extrair pra um array no `lib/brand.js`,
- (b) gerar via Claude no front com `window.claude.complete()` (precisa do `claude-helper` na sua tela),
- (c) salvar no backend e expor como endpoint `/api/resenha-do-dia`.

Me diz qual prefere.

---

## Fontes — caveat

Bowlby One + Nunito + DM Mono carregam do Google Fonts (`@import` no topo do `index.css`). Se você quer hospedar localmente:

1. Baixa de https://fonts.google.com/
2. Coloca em `frontend/public/fonts/`
3. Substitui o `@import` por `@font-face` apontando pra `/fonts/...`

---

## Checklist visual rápido

Depois de aplicar, confirma:

- [ ] Body com fundo `#1a1410` (jungle coffee) com dois radial-gradients sutis
- [ ] Header sticky com mascote gorilla 44×44 e nav em pill banana
- [ ] Ranking mostra MVP + Troll cards no topo (com mascote inclinado)
- [ ] Player cards em grid 3-col com sombra empilhada
- [ ] Perfil tem hero com avatar 110px e crown opcional 🔥
- [ ] Histórico de partidas com barra vertical verde/vermelha no início
- [ ] Comparativo + Evolução usando Recharts mas com cores quentes/banana
- [ ] Tudo em PT-BR informal: "Caça o monkey…", "5 maluco online", etc.

Qualquer coisa quebrada, me manda print + path do arquivo e eu corrijo.
