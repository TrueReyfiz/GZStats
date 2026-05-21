from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import StatsPartida, Partida

router = APIRouter(prefix="/partidas", tags=["partidas"])


@router.get("/{puuid}")
def listar_partidas(
    puuid: str,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    """Últimas N partidas Flex de um jogador, ordenadas por data real da partida"""
    resultados = db.query(StatsPartida, Partida)\
        .join(Partida, Partida.match_id == StatsPartida.match_id)\
        .filter(StatsPartida.puuid == puuid)\
        .order_by(Partida.data.desc())\
        .limit(limit).all()

    return [
        {
            "match_id":           s.match_id,
            "campeao":            s.campeao,
            "rota":               s.rota,
            "kills":              s.kills,
            "deaths":             s.deaths,
            "assists":            s.assists,
            "kda":                round((s.kills + s.assists) / max(s.deaths, 1), 2),
            "cs":                 s.cs,
            "cspm":               round(s.cs / max(s.duracao_min, 1), 2),
            "visao":              s.visao,
            "dano_por_min":       s.dano_por_min,
            "gd15":               s.gd15,
            "xpd15":              s.xpd15,
            "csd15":              s.csd15,
            "vitoria":            s.vitoria,
            "kill_participation": s.kill_participation,
            "duracao_min":        s.duracao_min,
            "data":               p.data.isoformat() if p.data else None,
            "patch":              p.patch,
        }
        for s, p in resultados
    ]
