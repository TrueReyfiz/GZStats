from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import Jogador, StatsPartida, HistoricoLP
from scheduler import atualizar_jogador
from utils import elo_score, lp_absoluto

router = APIRouter(prefix="/stats", tags=["stats"])

STATS_LIMIT = 50


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
    """Médias de todos os jogadores — últimas 50 partidas"""
    jogadores = db.query(Jogador).all()
    resultado = []

    for j in jogadores:
        stats = db.query(StatsPartida)\
            .filter(StatsPartida.puuid == j.puuid)\
            .order_by(StatsPartida.id.desc())\
            .limit(STATS_LIMIT).all()

        if not stats:
            continue

        n            = len(stats)
        kda_list     = [(s.kills + s.assists) / max(s.deaths, 1) for s in stats]
        gd15_validos = [s.gd15 for s in stats if s.gd15 is not None]
        total        = j.wins + j.losses

        resultado.append({
            "puuid":               j.puuid,
            "riot_id":             j.riot_id,
            "tier":                j.tier,
            "rank":                j.rank,
            "lp":                  j.lp,
            "kda":                 round(sum(kda_list) / n, 2),
            "cspm":                round(sum(s.cs / max(s.duracao_min, 1) for s in stats) / n, 2),
            "dpm":                 round(sum(s.dano_por_min for s in stats) / n, 1),
            "visao":               round(sum(s.visao for s in stats) / n, 2),
            "kp":                  round(sum(s.kill_participation for s in stats) / n, 1),
            "winrate":             round(j.wins / total * 100, 1) if total > 0 else 0,
            "gd15":                round(sum(gd15_validos) / len(gd15_validos), 1) if gd15_validos else 0,
            "hot_streak":          j.hot_streak,
            "partidas_analisadas": n,
        })

    # Ordenar corretamente: Tier > Rank > LP
    resultado.sort(
        key=lambda x: elo_score(x["tier"], x["rank"], x["lp"]),
        reverse=True
    )
    return resultado


@router.get("/evolucao/{puuid}")
def evolucao_lp(puuid: str, db: Session = Depends(get_db)):
    """Histórico de LP — com LP absoluto para gráfico de progressão real"""
    historico = db.query(HistoricoLP)\
        .filter(HistoricoLP.puuid == puuid)\
        .order_by(HistoricoLP.registrado_em.asc())\
        .all()

    return [{
        "lp":            h.lp,
        "lp_absoluto":   lp_absoluto(h.tier, h.rank, h.lp),
        "tier":          h.tier,
        "rank":          h.rank,
        "registrado_em": h.registrado_em.isoformat() if h.registrado_em else None,
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
            .limit(10).all()

        if len(stats) < 3:
            continue

        # Hot streak da API Riot
        if j.hot_streak:
            alertas_lista.append({
                "tipo":     "hot_streak",
                "riot_id":  j.riot_id,
                "mensagem": f"{j.riot_id} está em sequência de vitórias!",
            })

        # Contar derrotas consecutivas exatas
        streak_derrota = 0
        for s in stats:
            if not s.vitoria:
                streak_derrota += 1
            else:
                break

        if streak_derrota >= 3:
            alertas_lista.append({
                "tipo":     "tilt",
                "riot_id":  j.riot_id,
                "mensagem": f"{j.riot_id} está em {streak_derrota} derrotas seguidas.",
                "streak":   streak_derrota,
            })

    return alertas_lista
