# GZStats — Gorillaz Hub

Dashboard interno de stats para o time de League of Legends — **The Gorillaz · BR1 Flex**.

## Stack

- **Backend:** Python + FastAPI + SQLAlchemy + RiotWatcher (Riot API)
- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Banco:** PostgreSQL (Supabase) em produção, SQLite local
- **Hospedagem:** Render (backend) + Vercel (frontend)

## Rodar localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Crie um `backend/.env` com:

```
RIOT_API_KEY=RGAPI-xxxx
DATABASE_URL=sqlite:///./gzstats.db   # local
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173  
API docs: http://localhost:8000/docs

## Rotas

| Rota                | Página             |
| ------------------- | ------------------ |
| `/`                 | Ranking do squad   |
| `/jogador/:puuid`   | Perfil do jogador  |
| `/comparativo`      | Comparativo        |
| `/evolucao`         | Evolução de LP     |
| `/vergonha`         | Hall da Vergonha   |

## Produção

- Frontend: https://gz-stats.vercel.app
- Backend: https://gzstats.onrender.com
