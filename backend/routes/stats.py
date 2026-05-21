from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import Jogador, StatsPartida, HistoricoLP
from scheduler import atualizar_jogador

router = APIRouter(prefix="/stats", tags=["stats"])


@router.post("/sincronizar")
def sincronizar_todos():
    """Força re-sincronização de partidas e ranks de todos os jogadores"""
    db = SessionLocal()
    resultados = []
    try:
        jogadores = db.query(Jogador).all()
        for j in jogadores:
            try:
                atualizar_jogador(db, j)
                resultados.append({"jogador": j.riot_id, "status": "ok"})
            except Exception as e:
                resultados.append({"jogador": j.riot_id, "status": f"erro: {str(e)}"})
    finally:
        db.close()
    return {"sincronizados": len(resultados), "detalhes": resultados}


@router.get("/comparativo")
def comparativo(db: Session = Depends(get_db)):
    """Médias de todos os jogadores para o gráfico comparativo"""
    jogadores = db.query(Jogador).all()
    resultado = []

    for j in jogadores:
        stats = db.query(StatsPartida)\
            .filter(StatsPartida.puuid == j.puuid)\
            .order_by(StatsPartida.id.desc())\
            .limit(20).all()

        if not stats:
            continue

        n = len(stats)
        kda_list = [(s.kills + s.assists) / max(s.deaths, 1) for s in stats]
        total = j.wins + j.losses

        resultado.append({
            "puuid":    j.puuid,
            "riot_id":  j.riot_id,
            "tier":     j.tier,
            "rank":     j.rank,
            "lp":       j.lp,
            "kda":      round(sum(kda_list) / n, 2),
            "cspm":     round(sum(s.cs / max(s.duracao_min, 1) for s in stats) / n, 2),
            "dpm":      round(sum(s.dano_por_min for s in stats) / n, 1),
            "visao":    round(sum(s.visao for s in stats) / n, 2),
            "winrate":  round(j.wins / total * 100, 1) if total > 0 else 0,
            "gd15":     round(sum(s.gd15 for s in stats if s.gd15 is not None) / max(sum(1 for s in stats if s.gd15 is not None), 1), 1),
            "hot_streak": j.hot_streak
        })

    # Ordenar por LP
    resultado.sort(key=lambda x: x["lp"], reverse=True)
    return resultado


@router.get("/evolucao/{puuid}")
def evolucao_lp(puuid: str, db: Session = Depends(get_db)):
    """Histórico de LP do jogador para o gráfico de linha"""
    historico = db.query(HistoricoLP)\
        .filter(HistoricoLP.puuid == puuid)\
        .order_by(HistoricoLP.registrado_em.asc())\
        .all()

    return [{
        "lp":            h.lp,
        "tier":          h.tier,
        "rank":          h.rank,
        "registrado_em": h.registrado_em
    } for h in historico]


@router.get("/alertas")
def alertas(db: Session = Depends(get_db)):
    """Detecta tilt (3+ derrotas seguidas) e hot streak"""
    jogadores = db.query(Jogador).all()
    alertas_lista = []

    for j in jogadores:
        stats = db.query(StatsPartida)\
            .filter(StatsPartida.puuid == j.puuid)\
            .order_by(StatsPartida.id.desc())\
            .limit(5).all()

        if len(stats) < 3:
            continue

        # Hot streak da API
        if j.hot_streak:
            alertas_lista.append({
                "tipo":    "hot_streak",
                "riot_id": j.riot_id,
                "mensagem": f"{j.riot_id} está em sequência de vitórias!"
            })

        # Detectar tilt: 3+ derrotas seguidas
        ultimas = stats[:3]
        if all(not s.vitoria for s in ultimas):
            alertas_lista.append({
                "tipo":    "tilt",
                "riot_id": j.riot_id,
                "mensagem": f"{j.riot_id} está em 3 ou mais derrotas seguidas."
            })

    return alertas_lista
