from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from scheduler import iniciar_scheduler
from routes import jogadores, partidas, stats

# Criar tabelas no banco na inicialização
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GZStats API",
    description="Dashboard de stats para o time de LoL — BR1 Flex",
    version="1.0.0"
)

# Liberar acesso do frontend (Vercel) ao backend (Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, trocar pelo domínio do Vercel
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(jogadores.router)
app.include_router(partidas.router)
app.include_router(stats.router)

@app.on_event("startup")
def startup():
    iniciar_scheduler()

@app.get("/")
def root():
    return {"app": "GZStats", "status": "online", "docs": "/docs"}
