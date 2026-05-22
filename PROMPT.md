# Prompt pro Claude Code — aplicar Direção D (Resenha) no GZStats

> **Como usar:** abra o seu repo `GZStats` no terminal, rode `claude` (Claude Code), e cole o bloco abaixo como primeira mensagem. Esse pacote (`handoff_claude_code/`) deve estar colocado **dentro** do repo (ou em um caminho que o Claude Code consiga ler).

---

## 📋 Cole isto no Claude Code

```
Olá! Quero que você aplique uma atualização visual completa no front-end
deste projeto (GZStats). O pacote de handoff está em
`handoff_claude_code/` na raiz do repo. Faça nesta ordem:

1. LEIA primeiro, sem editar nada:
   - `handoff_claude_code/CLAUDE.md` — contexto do produto e regras
   - `handoff_claude_code/drop-in/README.md` — passo a passo de aplicação
   - `handoff_claude_code/design-system/DESIGN_SYSTEM.md` — guidelines visuais
   - `handoff_claude_code/design-system/colors_and_type.css` — tokens

2. INSPECIONE o estado atual do front em `frontend/src/`
   (componentes, páginas, App.jsx, index.css, tailwind.config.js)
   e me confirme em uma frase o que existe hoje vs o que vai mudar.

3. CRIE uma branch nova:
       git checkout -b direcao-d-resenha

4. APLIQUE os arquivos do `handoff_claude_code/drop-in/` seguindo
   EXATAMENTE o passo-a-passo do README dele
   (`handoff_claude_code/drop-in/README.md`, seção “Como aplicar no seu repo”).
   Use `cp` reais — não recrie arquivos do zero.

5. RODE `npm install` e `npm run dev` no `frontend/`. Resolva qualquer
   erro de import / classe Tailwind que aparecer. NÃO toque em
   `frontend/src/services/api.js` nem no backend.

6. VERIFIQUE manualmente cada rota e me reporte:
   - `/`            → Ranking com cards MVP/Troll
   - `/jogador/:p`  → Perfil com hero + stat boxes + histórico
   - `/comparativo` → Recharts com paleta nova
   - `/evolucao`    → Recharts com paleta nova
   - `/vergonha`    → NOVA rota (Hall da Vergonha)
   Use o checklist visual no final do `drop-in/README.md`.

7. COMMITE em chunks lógicos (tokens → componentes → páginas → rota nova),
   mensagens em PT-BR. Não dê push — eu reviso o diff antes.

Restrições:
- Não altere a API do backend nem adicione campos novos sem perguntar.
- O campo `rota_principal` no jogador é OPCIONAL — o front já trata
  ausência. Se o backend não tem, deixe assim.
- Fontes vêm do Google Fonts via @import no `index.css`. Se preferir
  self-host, me pergunte antes.
- Se algo não bater 1:1 com o design system, abra issue/TODO no código
  com `// TODO(design):` em vez de chutar.

Quando terminar, faça um resumo curto do diff (arquivos novos /
modificados / deletados) e cole o output de qualquer teste rodado.
```

---

## 🗂 Estrutura do pacote

```
handoff_claude_code/
├── PROMPT.md               ← este arquivo (cole no Claude Code)
├── CLAUDE.md               ← contexto persistente (Claude Code lê auto)
├── drop-in/                ← código pronto pra copiar pro repo
│   ├── README.md           ← passo-a-passo + checklist visual
│   ├── tailwind.config.js
│   ├── public/             ← SVGs do mascote
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── lib/brand.js
│       ├── components/     ← 10 componentes novos
│       └── pages/          ← 5 páginas (1 nova: HallVergonha)
└── design-system/
    ├── DESIGN_SYSTEM.md    ← guidelines completas (tom, cor, tipo, etc)
    ├── colors_and_type.css ← variáveis CSS de referência
    ├── assets/             ← logos + mascotes + patterns SVG
    └── screenshots/        ← prints de cada tela renderizada
```

---

## 💡 Dicas práticas

**Coloque a pasta no repo antes de rodar Claude Code.** Se a pasta
estiver fora do diretório de trabalho, o Claude Code não consegue ler.
Sugestão:

```bash
# Na raiz do GZStats:
cp -R ~/Downloads/handoff_claude_code ./
git status   # vai aparecer untracked, tudo bem
claude       # abre o Claude Code aqui mesmo
```

**Não precisa commitar o handoff.** Adicione ao `.gitignore` se quiser:

```bash
echo "handoff_claude_code/" >> .gitignore
```

**Se quiser que o Claude Code lembre do contexto entre sessões**, mova
o `CLAUDE.md` pra raiz do repo (ele lê automaticamente de lá). O do
handoff é uma cópia segura caso você queira manter dois contextos.

**Se ele errar algo**, aponte o arquivo + linha (`components/PlayerCard.jsx:42`)
e mande o screenshot do problema. Claude Code é muito melhor com
referência concreta do que com descrição.

---

## 🔁 Iteração depois

Depois que o Claude Code aplicar a base, você pode pedir mudanças
incrementais sem reabrir esse pacote. Exemplos:

- “No `Ranking.jsx`, troca o copy do card MVP de ‘Carregou a partida’
  pra algo mais picante; gera 5 opções.”
- “No `tailwind.config.js`, abaixa o `shadow-card` em 50% — tá pesado.”
- “Cria um modal de detalhes de partida quando clica no `MatchRow`.”

Pra mudanças visuais grandes, volte aqui (no Open Mart) e a gente
explora variações antes de re-handoff.
