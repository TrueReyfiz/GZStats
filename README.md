# 🎮 GZStats

Dashboard interno para acompanhar os stats do time de League of Legends (BR1 — Flex).
Desenvolvido com Python + FastAPI no backend e React no frontend.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Pré-requisitos](#pré-requisitos)
5. [Configuração do Ambiente](#configuração-do-ambiente)
6. [Rodando o Projeto](#rodando-o-projeto)
7. [Variáveis de Ambiente](#variáveis-de-ambiente)
8. [Banco de Dados](#banco-de-dados)
9. [Rotas da API](#rotas-da-api)
10. [Deploy](#deploy)
11. [Regras Importantes](#regras-importantes)

---

## Visão Geral

O projeto coleta automaticamente a cada 30 minutos os dados dos jogadores
cadastrados via Riot API (BR1), salva no banco de dados e expõe as informações
em um dashboard com:

- Ranking do time por LP
- Stats individuais detalhados (KDA, CS/min, Vision Score, DPM)
- Histórico das últimas partidas
- Comparativo entre jogadores
- Gráficos de evolução de LP e métricas ao longo do tempo

---

## Tecnologias

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Python | 3.11+ | Linguagem principal |
| FastAPI | latest | Servidor HTTP / API REST |
| SQLAlchemy | latest | ORM (intermediário com o banco) |
| SQLite | — | Banco local (desenvolvimento) |
| PostgreSQL | — | Banco em produção (Render) |
| RiotWatcher | latest | Wrapper da Riot API |
| APScheduler | latest | Atualização automática a cada 30min |
| python-dotenv | latest | Carrega variáveis de ambiente |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18+ | Interface visual |
| React Router | latest | Navegação entre páginas |
| Tailwind CSS | latest | Estilização |
| Recharts | latest | Gráficos |
| Axios | latest | Chamadas HTTP ao backend |

---

## Estrutura do Projeto

```
GZStats/
│
├── backend/
│   ├── main.py              # Ponto de entrada do FastAPI
│   ├── riot_client.py       # Toda comunicação com a Riot API
│   ├── database.py          # Conexão e sessão do banco (SQLAlchemy)
│   ├── models.py            # Definição das tabelas do banco
│   ├── scheduler.py         # Job de atualização automática (30min)
│   ├── routes/
│   │   ├── jogadores.py     # GET /jogadores, GET /jogadores/{puuid}
│   │   ├── partidas.py      # GET /partidas/{puuid}
│   │   └── stats.py         # GET /stats/comparativo, GET /stats/evolucao
│   ├── requirements.txt     # Dependências Python
│   └── .env                 # ⚠️ NUNCA subir pro GitHub
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Ranking.jsx        # Tabela de ranking do time
│   │   │   ├── Perfil.jsx         # Stats individuais do jogador
│   │   │   ├── Comparativo.jsx    # Comparação entre jogadores
│   │   │   └── Evolucao.jsx       # Gráficos de evolução
│   │   ├── components/
│   │   │   ├── CardJogador.jsx    # Card reutilizável
│   │   │   ├── GraficoLinha.jsx   # Componente de linha (LP, KDA)
│   │   │   ├── GraficoBarra.jsx   # Componente de barras (comparativo)
│   │   │   ├── TabelaRanking.jsx  # Tabela principal
│   │   │   └── Navbar.jsx         # Menu de navegação
│   │   ├── services/
│   │   │   └── api.js             # Todas as chamadas ao backend
│   │   └── App.jsx                # Roteamento
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Pré-requisitos

Instale as seguintes ferramentas antes de começar:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) (recomendado)
- Conta no [Riot Developer Portal](https://developer.riotgames.com/) para gerar a chave de API

---

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/lol-dashboard.git
cd lol-dashboard
```

### 2. Configurar o backend

```bash
cd backend
python -m venv venv          # Cria ambiente virtual

# Ativar o ambiente virtual:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Criar o arquivo .env

Crie um arquivo chamado `.env` dentro da pasta `backend/` com o seguinte conteúdo:

```
RIOT_API_KEY=RGAPI-sua-chave-aqui
DATABASE_URL=sqlite:///./dashboard.db
```

> ⚠️ A chave de desenvolvimento da Riot expira a cada 24 horas.
> Renove em https://developer.riotgames.com sempre que necessário.

### 4. Configurar o frontend

```bash
cd ../frontend
npm install
```

---

## Rodando o Projeto

### Backend (em um terminal)

```bash
cd backend
source venv/bin/activate    # ou venv\Scripts\activate no Windows
uvicorn main:app --reload --port 8000
```

O backend estará disponível em: `http://localhost:8000`
Documentação automática da API: `http://localhost:8000/docs`

### Frontend (em outro terminal)

```bash
cd frontend
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `RIOT_API_KEY` | Chave da Riot API | `RGAPI-xxxx-xxxx` |
| `DATABASE_URL` | URL do banco de dados | `sqlite:///./dashboard.db` |

Em produção (Render), o `DATABASE_URL` será trocado automaticamente para o PostgreSQL.

---

## Banco de Dados

### Tabelas principais

**jogadores** — dados atuais de cada jogador
```
id | puuid | riot_id | tag | tier | rank | lp | wins | losses | hot_streak | atualizado_em
```

**partidas** — dados brutos de cada partida
```
match_id | queue | duracao | patch | data | raw_json
```

**stats_partida** — métricas extraídas por jogador por partida
```
id | match_id | puuid | campeao | rota | kills | deaths | assists |
cs | visao | dano_por_min | gd15 | xpd15 | csd15 | vitoria
```

**historico_lp** — snapshot de LP ao longo do tempo (para gráfico de evolução)
```
id | puuid | lp | tier | rank | registrado_em
```

---

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/jogadores` | Lista todos os jogadores com rank e LP |
| GET | `/jogadores/{puuid}` | Stats detalhados de um jogador |
| GET | `/partidas/{puuid}` | Últimas 20 partidas Flex de um jogador |
| GET | `/stats/comparativo` | Métricas de todos para comparação |
| GET | `/stats/evolucao/{puuid}` | Histórico de LP do jogador |
| POST | `/jogadores` | Adiciona um novo jogador pelo Riot ID |
| POST | `/atualizar` | Força atualização manual dos dados |

---

## Deploy

### Backend no Render

1. Criar conta em [render.com](https://render.com)
2. Criar novo **Web Service** apontando para a pasta `backend/`
3. Configurar:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Adicionar variáveis de ambiente no painel do Render:
   - `RIOT_API_KEY`
   - `DATABASE_URL` (usar o PostgreSQL gratuito do Render)

### Frontend no Vercel

1. Criar conta em [vercel.com](https://vercel.com)
2. Importar o repositório, apontar para a pasta `frontend/`
3. Configurar a variável:
   - `VITE_API_URL` = URL do backend no Render (ex: `https://lol-dashboard.onrender.com`)

---

## Regras Importantes

### Segurança
- ❌ **Nunca** coloque a chave da Riot API no código ou no frontend
- ❌ **Nunca** faça chamadas à Riot API direto do frontend
- ✅ A chave fica **somente** no arquivo `.env` do backend
- ✅ O `.env` está no `.gitignore` — confirme antes do primeiro commit

### Riot API
- A chave de **desenvolvimento** expira a cada 24 horas — renove diariamente
- Rate limit: 20 req/segundo e 100 req/2 minutos
- O scheduler roda a cada 30 min para não estourar o limite
- O **Spectator-V5 foi desativado** em outubro de 2025 — não é possível ver partidas ao vivo
- Use sempre **Riot ID** (Nome#Tag) para buscar jogadores, não Summoner Name (deprecado)

### Git
- Sempre rode `git status` antes de fazer commit
- Nunca dê commit no arquivo `.env`
- Escreva mensagens de commit descritivas: `git commit -m "adiciona rota de comparativo"`

---

## Adicionando Jogadores

Para adicionar um jogador ao dashboard, faça uma requisição POST:

```bash
curl -X POST http://localhost:8000/jogadores \
  -H "Content-Type: application/json" \
  -d '{"game_name": "NomeDoJogador", "tag_line": "BR1"}'
```

Ou use a interface em `http://localhost:8000/docs` (Swagger automático do FastAPI).

---

## Suporte

Dúvidas sobre a Riot API: https://developer.riotgames.com/docs/lol
Documentação FastAPI: https://fastapi.tiangolo.com
Documentação React: https://react.dev