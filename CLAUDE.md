# GZStats / Gorillaz Hub — contexto pro Claude Code

Você está trabalhando no **GZStats** (também conhecido como **Gorillaz Hub**),
um dashboard interno do squad **The Gorillaz** (LoL — BR1 Flex). Stack atual:

- **Backend:** FastAPI + RiotWatcher (Riot API) — consome stats e expõe REST
- **Frontend:** React + Vite + Tailwind + Recharts + React Router
- **Repo original:** https://github.com/TrueReyfiz/GZStats

## O que esta atualização faz

Reskinning visual completo do front-end pra **Direção D — Resenha**:
estética cartoon/sticker quente (jungle coffee + banana yellow), com
mascote gorila, copywriting de resenha de Discord, e uma rota nova
`/vergonha` (Hall da Vergonha).

**Não toca no backend.** Toda a UI continua consumindo `services/api.js`
exatamente como antes.

## Páginas e rotas

| Rota              | Componente       | Status         |
| ----------------- | ---------------- | -------------- |
| `/`               | `Ranking`        | Reescrito      |
| `/jogador/:puuid` | `Perfil`         | Reescrito      |
| `/comparativo`    | `Comparativo`    | Reescrito      |
| `/evolucao`       | `Evolucao`       | Reescrito      |
| `/vergonha`       | `HallVergonha`   | **NOVO**       |

## Tom de voz (importante)

- **Português brasileiro, informal, gíria de jogador.** Termos do jogo
  (KDA, LP, winrate, hot streak, tilt, top/jg/mid/bot/sup) em inglês.
- Resenha permitida — humor de squad, sem PG-13 forçado, sem palavrão gratuito.
- Eyebrow labels em CAPS com tracking largo (`uppercase tracking-widest`).
- Stats sempre em monospace tabular.

Veja `handoff_claude_code/design-system/DESIGN_SYSTEM.md` § 2 “Content Fundamentals”
pra exemplos canônicos de copy.

## Tokens visuais (resumo)

```
bg-bg-0  #1a1410   ← background página (jungle coffee)
bg-bg-1  #261c16   ← cards
bg-bg-2  #322519   ← hover / nested
text-cream  #fef3c7
text-warm-3 #d6a87a
text-warm-4 #a07956
bg-banana   #fbbf24  ← primário (CTA, nav ativa)
bg-jungle   #84cc16  ← vitórias, jungle role
bg-clay     #f97316  ← warn, hot streak
text-berry  #ec4899  ← raro, troll cards

font-display: "Bowlby One"  (H1, números grandes)
font-body:    "Nunito"       (UI text)
font-mono:    "DM Mono"      (stats tabulares)
```

Detalhes completos em `tailwind.config.js` no drop-in.

## Regras de design (resumo)

- **Dark mode only.** Não crie modo claro.
- **Radii:** `rounded-md` = 14px (cards), `rounded-lg` = 20px (panels).
- **Sombras empilhadas** estilo cartoon: `shadow-card`, `shadow-sticker`, `shadow-pill`.
- **Grid base 4px.** Múltiplos canônicos: 4 · 8 · 12 · 16 · 24 · 32.
- **Tier colors** (`tier.iron` → `tier.challenger`) são fixos por LoL — não substitua.
- **Sem ilustração à mão.** Use os SVGs em `design-system/assets/` ou peça antes.

## API que o front consome

Veja a tabela completa em `drop-in/README.md` § "API esperada". Em curto:

- `getJogadores()`, `getPerfil(puuid)`, `getPartidas(puuid)`
- `getComparativo()`, `getEvolucao(puuid, dias)`, `getEvolucaoStats(puuid, dias)`
- `getEvolucaoTime(dias)`, `getAlertas()`

**Campo opcional novo:** `rota_principal` no objeto de jogador.
Se o backend não fornece, o front esconde silenciosamente o ` · Mid/JG/Top`.
Não quebra nada.

## O que NÃO fazer

1. ❌ Não modifique `services/api.js` nem o backend FastAPI.
2. ❌ Não adicione modo claro / theming.
3. ❌ Não troque Recharts por outra lib de gráfico.
4. ❌ Não substitua as fontes sem perguntar (Bowlby One + Nunito + DM Mono).
5. ❌ Não invente endpoints novos. Se precisar de dado novo, abra TODO no código.
6. ❌ Não use `npx create-*` nem reinstale o projeto. Apenas `cp` os arquivos.
7. ❌ Não dê `git push` automático. Faça commits locais e pare.

## Quando estiver em dúvida

- **Sobre design:** consulte `design-system/DESIGN_SYSTEM.md` primeiro,
  depois os SVGs em `design-system/assets/`, depois os screenshots
  em `design-system/screenshots/`.
- **Sobre código:** olhe `drop-in/src/` — é a fonte da verdade.
- **Sobre comportamento:** pergunte ao usuário. Não chute UX.
