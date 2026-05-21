from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, SessionLocal
from models import Jogador, StatsPartida, HistoricoLP, HistoricoStats
from scheduler import atualizar_jogador
from utils import elo_score, lp_absoluto
from datetime import datetime, timedelta

router = APIRouter(prefix="/stats", tags=["stats"])

STATS_LIMIT = 50


# ─── Sincronização manual ────────────────────────────────────────────────────

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


# ─── Comparativo instantâneo ─────────────────────────────────────────────────

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

    resultado.sort(
        key=lambda x: elo_score(x["tier"], x["rank"], x["lp"]),
        reverse=True
    )
    return resultado


# ─── Evolução de LP ──────────────────────────────────────────────────────────

@router.get("/evolucao/{puuid}")
def evolucao_lp(puuid: str, dias: int = Query(default=0, ge=0), db: Session = Depends(get_db)):
    """
    Histórico de LP — com LP absoluto para gráfico de progressão real.
    dias=0 → tudo; dias=7 → últimos 7 dias; dias=30 → últimos 30 dias
    """
    q = db.query(HistoricoLP).filter(HistoricoLP.puuid == puuid)
    if dias > 0:
        corte = datetime.utcnow() - timedelta(days=dias)
        q = q.filter(HistoricoLP.registrado_em >= corte)
    historico = q.order_by(HistoricoLP.registrado_em.asc()).all()

    return [{
        "lp":            h.lp,
        "lp_absoluto":   lp_absoluto(h.tier, h.rank, h.lp),
        "tier":          h.tier,
        "rank":          h.rank,
        "registrado_em": h.registrado_em.isoformat() if h.registrado_em else None,
    } for h in historico]


# ─── Evolução de Stats (linha do tempo) ──────────────────────────────────────

@router.get("/evolucao-stats/{puuid}")
def evolucao_stats(puuid: str, dias: int = Query(default=0, ge=0), db: Session = Depends(get_db)):
    """
    Linha do tempo de stats de um jogador (snapshots diários).
    Retorna KDA, CS/m, DPM, Visão, KP%, WR, GD@15, XPD@15, CSD@15 ao longo do tempo.
    dias=0 → tudo; dias=7 → últimos 7 dias; dias=30 → últimos 30 dias
    """
    q = db.query(HistoricoStats).filter(HistoricoStats.puuid == puuid)
    if dias > 0:
        corte = datetime.utcnow() - timedelta(days=dias)
        q = q.filter(HistoricoStats.registrado_em >= corte)
    historico = q.order_by(HistoricoStats.registrado_em.asc()).all()

    return [{
        "registrado_em": h.registrado_em.isoformat() if h.registrado_em else None,
        "tier":          h.tier,
        "rank":          h.rank,
        "lp":            h.lp,
        "kda":           h.kda,
        "cspm":          h.cspm,
        "dpm":           h.dpm,
        "visao":         h.visao,
        "kp":            h.kp,
        "winrate":       h.winrate,
        "gd15":          h.gd15,
        "xpd15":         h.xpd15,
        "csd15":         h.csd15,
        "partidas":      h.partidas,
    } for h in historico]


@router.get("/evolucao-time")
def evolucao_time(dias: int = Query(default=30, ge=0), db: Session = Depends(get_db)):
    """
    Médias diárias do TIME — agrega os snapshots de todos os jogadores por data.
    Útil para ver se o time como um todo está melhorando.
    dias=0 → tudo; padrão 30 dias.
    """
    q = db.query(HistoricoStats)
    if dias > 0:
        corte = datetime.utcnow() - timedelta(days=dias)
        q = q.filter(HistoricoStats.registrado_em >= corte)
    todos = q.order_by(HistoricoStats.registrado_em.asc()).all()

    # Agrupar por data (dia)
    por_dia: dict[str, list] = {}
    for h in todos:
        dia = h.registrado_em.date().isoformat() if h.registrado_em else "?"
        por_dia.setdefault(dia, []).append(h)

    resultado = []
    for dia, snaps in sorted(por_dia.items()):
        n = len(snaps)
        gd15_v  = [s.gd15  for s in snaps if s.gd15  is not None]
        xpd15_v = [s.xpd15 for s in snaps if s.xpd15 is not None]
        csd15_v = [s.csd15 for s in snaps if s.csd15 is not None]

        resultado.append({
            "data":     dia,
            "jogadores": n,
            "kda":      round(sum(s.kda     for s in snaps) / n, 2),
            "cspm":     round(sum(s.cspm    for s in snaps) / n, 2),
            "dpm":      round(sum(s.dpm     for s in snaps) / n, 1),
            "visao":    round(sum(s.visao   for s in snaps) / n, 2),
            "kp":       round(sum(s.kp      for s in snaps) / n, 1),
            "winrate":  round(sum(s.winrate for s in snaps) / n, 1),
            "gd15":     round(sum(gd15_v)   / len(gd15_v),  1) if gd15_v  else None,
            "xpd15":    round(sum(xpd15_v)  / len(xpd15_v), 1) if xpd15_v else None,
            "csd15":    round(sum(csd15_v)  / len(csd15_v), 1) if csd15_v else None,
        })

    return resultado


# ─── Alertas ─────────────────────────────────────────────────────────────────

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

        if j.hot_streak:
            alertas_lista.append({
                "tipo":     "hot_streak",
                "riot_id":  j.riot_id,
                "mensagem": f"{j.riot_id} está em sequência de vitórias!",
            })

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
