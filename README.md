# GZStats

Dashboard interno de stats para o time de League of Legends — BR1 Flex.

## Stack
- Backend: Python + FastAPI + SQLAlchemy + RiotWatcher
- Frontend: React + Tailwind CSS + Recharts
- Banco: SQLite (local) → PostgreSQL (produção)
- Hospedagem: Render (backend) + Vercel (frontend)

## Rodar localmente

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173
API docs: http://localhost:8000/docs
